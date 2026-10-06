import {
  MemoryItem,
  LedgerBlock,
  ProvenanceNode,
  BlastRadiusReport,
  LedgerAuditResult,
  NodeType,
} from './types';
import { GENESIS_HASH, calculateBlockHash, sha256Sync } from './crypto';

export class LedgerGraphManager {
  private memories: Map<string, MemoryItem> = new Map();
  private ledger: LedgerBlock[] = [];
  private dagNodes: Map<string, ProvenanceNode> = new Map();
  private preAttackSnapshots: Array<{ timestamp: number; memories: MemoryItem[]; ledger: LedgerBlock[] }> = [];

  constructor() {
    this.initGenesis();
  }

  private initGenesis() {
    this.memories.clear();
    this.ledger = [];
    this.dagNodes.clear();

    const genesisBlock: LedgerBlock = {
      index: 0,
      timestamp: Date.now() - 3600000 * 24,
      memoryId: 'GENESIS_ROOT',
      payloadHash: sha256Sync('GENESIS_HARDWARE_ROOT_SECURITY_BASE'),
      previousHash: GENESIS_HASH,
      currentHash: calculateBlockHash(
        0,
        Date.now() - 3600000 * 24,
        'GENESIS_ROOT',
        sha256Sync('GENESIS_HARDWARE_ROOT_SECURITY_BASE'),
        GENESIS_HASH
      ),
      payloadSummary: 'Hardware Root of Trust Anchor (Trust: 1.0)',
    };

    this.ledger.push(genesisBlock);
  }

  public getMemories(): MemoryItem[] {
    return Array.from(this.memories.values()).sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
  }

  public getMemory(id: string): MemoryItem | undefined {
    return this.memories.get(id);
  }

  public getLedger(): LedgerBlock[] {
    return [...this.ledger];
  }

  public getDagNodes(): ProvenanceNode[] {
    return Array.from(this.dagNodes.values());
  }

  public getChainHead(): string {
    if (this.ledger.length === 0) return GENESIS_HASH;
    return this.ledger[this.ledger.length - 1].currentHash;
  }

  /**
   * Append a new memory record to the cryptographic ledger & DAG
   */
  public appendMemory(
    memory: MemoryItem,
    nodeType: NodeType = 'raw_source',
    label?: string
  ): LedgerBlock {
    const previousBlock = this.ledger[this.ledger.length - 1];
    const previousHash = previousBlock ? previousBlock.currentHash : GENESIS_HASH;
    const newIndex = this.ledger.length;

    const payloadHash = sha256Sync(
      `${memory.id}|${memory.content}|${memory.effectiveTrust}|${memory.metadata.source}|${JSON.stringify(memory.parentIds)}`
    );

    const blockHash = calculateBlockHash(
      newIndex,
      memory.metadata.createdAt,
      memory.id,
      payloadHash,
      previousHash
    );

    const block: LedgerBlock = {
      index: newIndex,
      timestamp: memory.metadata.createdAt,
      memoryId: memory.id,
      payloadHash,
      previousHash,
      currentHash: blockHash,
      payloadSummary: memory.content.slice(0, 64) + (memory.content.length > 64 ? '...' : ''),
    };

    this.ledger.push(block);

    // Save with ledger index and hashes
    const updatedMemory: MemoryItem = {
      ...memory,
      ledgerIndex: newIndex,
      blockHash,
      previousHash,
    };
    this.memories.set(memory.id, updatedMemory);

    // Add / update DAG node
    const dagNode: ProvenanceNode = {
      id: memory.id,
      label: label || memory.id,
      type: nodeType,
      content: memory.content,
      trustScore: memory.effectiveTrust,
      status: memory.status,
      isTainted: memory.isTainted,
      parents: [...memory.parentIds],
      children: [...memory.childrenIds],
    };
    this.dagNodes.set(memory.id, dagNode);

    // Update parent's children links
    for (const parentId of memory.parentIds) {
      const parentMem = this.memories.get(parentId);
      if (parentMem && !parentMem.childrenIds.includes(memory.id)) {
        parentMem.childrenIds.push(memory.id);
      }
      const parentNode = this.dagNodes.get(parentId);
      if (parentNode && !parentNode.children.includes(memory.id)) {
        parentNode.children.push(memory.id);
      }
    }

    return block;
  }

  /**
   * Save a snapshot before an attack test
   */
  public takeSnapshot() {
    this.preAttackSnapshots.push({
      timestamp: Date.now(),
      memories: JSON.parse(JSON.stringify(Array.from(this.memories.values()))),
      ledger: JSON.parse(JSON.stringify(this.ledger)),
    });
  }

  /**
   * Graph Traversal: Find all downstream descendants (Blast Radius) of a tainted root
   */
  public computeBlastRadius(compromisedId: string): string[] {
    const taintedDescendants = new Set<string>();
    const queue: string[] = [compromisedId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.dagNodes.get(currentId);
      if (node) {
        for (const childId of node.children) {
          if (!taintedDescendants.has(childId)) {
            taintedDescendants.add(childId);
            queue.push(childId);
          }
        }
      }
    }

    return Array.from(taintedDescendants);
  }

  /**
   * Blast-Radius Purge & Rollback
   * Traverses DAG, purges contaminated descendant memories,
   * creates cryptographic tombstones in the ledger, and restores chain consistency.
   */
  public executeBlastRadiusPurge(compromisedId: string): BlastRadiusReport {
    const taintedNodeIds = this.computeBlastRadius(compromisedId);
    taintedNodeIds.unshift(compromisedId); // Include root compromised memory

    const purgedDerivedFacts: string[] = [];
    const purgedPlans: string[] = [];

    // Mark and remove purged nodes from graph
    for (const id of taintedNodeIds) {
      const mem = this.memories.get(id);
      const node = this.dagNodes.get(id);

      if (node?.type === 'derived_fact') {
        purgedDerivedFacts.push(id);
      } else if (node?.type === 'agent_plan' || node?.type === 'action_intent') {
        purgedPlans.push(id);
      }

      if (mem) {
        mem.isTainted = true;
        mem.status = 'POISONED';
        mem.taintReason = `Purged via Blast Radius from ${compromisedId}`;
      }

      // Remove from active DAG
      this.dagNodes.delete(id);
    }

    // Clean up remaining nodes' parent/children references
    for (const node of this.dagNodes.values()) {
      node.parents = node.parents.filter(p => !taintedNodeIds.includes(p));
      node.children = node.children.filter(c => !taintedNodeIds.includes(c));
    }

    // Add a Cryptographic Tombstone / Purge Audit block to the ledger
    const prevBlock = this.ledger[this.ledger.length - 1];
    const prevHash = prevBlock ? prevBlock.currentHash : GENESIS_HASH;
    const tombstoneIndex = this.ledger.length;
    const payloadHash = sha256Sync(`PURGE_AUDIT_TOMBSTONE|${compromisedId}|${taintedNodeIds.join(',')}`);
    const blockHash = calculateBlockHash(
      tombstoneIndex,
      Date.now(),
      `TOMBSTONE-${compromisedId}`,
      payloadHash,
      prevHash
    );

    this.ledger.push({
      index: tombstoneIndex,
      timestamp: Date.now(),
      memoryId: `TOMBSTONE-${compromisedId}`,
      payloadHash,
      previousHash: prevHash,
      currentHash: blockHash,
      payloadSummary: `[BLAST-RADIUS PURGE] Severed ${taintedNodeIds.length} tainted nodes rooted at ${compromisedId}`,
    });

    return {
      rootCompromisedId: compromisedId,
      taintedNodeIds,
      purgedDerivedFacts,
      purgedPlans,
      blockedActions: purgedPlans.filter(p => p.includes('PLAN') || p.includes('ACTION')),
      ledgerTombstonesCreated: 1,
      timestamp: Date.now(),
    };
  }

  /**
   * Cryptographic Ledger Audit:
   * Re-hashes every block from genesis to head.
   * If any block's payload or previousHash is modified, the audit FAILS immediately!
   */
  public auditLedgerIntegrity(): LedgerAuditResult {
    if (this.ledger.length === 0) {
      return {
        isValid: true,
        totalBlocks: 0,
        brokenBlockIndex: null,
        expectedHash: null,
        actualHash: null,
        chainHead: GENESIS_HASH,
      };
    }

    for (let i = 0; i < this.ledger.length; i++) {
      const block = this.ledger[i];

      // Genesis check
      if (i === 0) {
        if (block.previousHash !== GENESIS_HASH) {
          return {
            isValid: false,
            totalBlocks: this.ledger.length,
            brokenBlockIndex: 0,
            expectedHash: GENESIS_HASH,
            actualHash: block.previousHash,
            chainHead: block.currentHash,
          };
        }
        continue;
      }

      // Check linkage with previous block
      const prevBlock = this.ledger[i - 1];
      if (block.previousHash !== prevBlock.currentHash) {
        return {
          isValid: false,
          totalBlocks: this.ledger.length,
          brokenBlockIndex: i,
          expectedHash: prevBlock.currentHash,
          actualHash: block.previousHash,
          chainHead: this.ledger[this.ledger.length - 1].currentHash,
        };
      }

      // Recompute this block's hash
      const recalculated = calculateBlockHash(
        block.index,
        block.timestamp,
        block.memoryId,
        block.payloadHash,
        block.previousHash
      );

      if (recalculated !== block.currentHash || block.isTampered) {
        return {
          isValid: false,
          totalBlocks: this.ledger.length,
          brokenBlockIndex: i,
          expectedHash: recalculated,
          actualHash: block.currentHash,
          chainHead: this.ledger[this.ledger.length - 1].currentHash,
        };
      }
    }

    return {
      isValid: true,
      totalBlocks: this.ledger.length,
      brokenBlockIndex: null,
      expectedHash: null,
      actualHash: null,
      chainHead: this.ledger[this.ledger.length - 1].currentHash,
    };
  }

  /**
   * Simulate a malicious database tampering event
   * Modifies block payload directly in storage without updating hash
   */
  public simulateMaliciousTampering(blockIndex: number): boolean {
    if (blockIndex < 0 || blockIndex >= this.ledger.length) return false;
    const block = this.ledger[blockIndex];
    block.payloadHash = sha256Sync('MALICIOUS_INJECTED_BANK_ACCOUNT_FRAUD');
    block.payloadSummary = '[ALTERED DIRECTLY IN DB] Wire to Offshore Account XYZ';
    block.isTampered = true;
    return true;
  }

  /**
   * Revert state to snapshot or repair chain
   */
  public rollbackToLatestSnapshot(): boolean {
    if (this.preAttackSnapshots.length === 0) return false;
    const snapshot = this.preAttackSnapshots.pop()!;
    this.memories.clear();
    for (const m of snapshot.memories) {
      this.memories.set(m.id, m);
    }
    this.ledger = [...snapshot.ledger];

    // Reconstruct DAG
    this.dagNodes.clear();
    for (const m of snapshot.memories) {
      this.dagNodes.set(m.id, {
        id: m.id,
        label: m.id,
        type: (m.id.startsWith('RAW') || m.id.startsWith('EML') || m.id.startsWith('BASE'))
          ? 'raw_source'
          : m.id.startsWith('FACT')
          ? 'derived_fact'
          : 'agent_plan',
        content: m.content,
        trustScore: m.effectiveTrust,
        status: m.status,
        isTainted: m.isTainted,
        parents: [...m.parentIds],
        children: [...m.childrenIds],
      });
    }
    return true;
  }
}

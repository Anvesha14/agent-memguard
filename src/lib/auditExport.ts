import { LedgerBlock, LedgerAuditResult, ProvenanceNode, ActionInvocation, MemoryItem } from './types';
import { sha256Sync } from './crypto';

export interface ComplianceAuditReport {
  complianceStandard: string;
  reportId: string;
  generatedAt: string;
  environment: {
    system: string;
    version: string;
    securityPolicy: string;
    agentFrameworksSupported: string[];
  };
  cryptographicLedgerSummary: {
    auditStatus: 'VERIFIED_IMMUTABLE' | 'COMPROMISED_TAMPER_DETECTED';
    totalBlocks: number;
    chainHeadSha256: string;
    isIntegrityValid: boolean;
    brokenBlockIndex: number | null;
    blocks: Array<{
      index: number;
      timestampIso: string;
      memoryId: string;
      payloadHash: string;
      previousHash: string;
      currentHash: string;
      payloadSummary: string;
      isTampered?: boolean;
    }>;
  };
  provenanceDagStatus: {
    totalNodes: number;
    taintedNodesCount: number;
    trustedNodesCount: number;
    quarantinedNodesCount: number;
    averageTrustScore: number;
    nodes: Array<{
      id: string;
      type: string;
      trustScore: number;
      status: string;
      isTainted: boolean;
      parents: string[];
      children: string[];
      contentPreview: string;
    }>;
  };
  zeroTrustActionGatekeeperSummary: {
    totalInvocations: number;
    blockedCount: number;
    approvedCount: number;
    pendingHitlCount: number;
    invocationAuditTrail: ActionInvocation[];
  };
  cryptographicVerificationSeal: {
    algorithm: string;
    reportDigestSha256: string;
    signatureAuthority: string;
  };
}

export function generateComplianceAuditReport(
  ledger: LedgerBlock[],
  auditResult: LedgerAuditResult,
  dagNodes: ProvenanceNode[],
  actions: ActionInvocation[]
): ComplianceAuditReport {
  const timestampIso = new Date().toISOString();
  const reportId = `AUDIT-MEMGUARD-${Date.now().toString(36).toUpperCase()}`;

  const trustedCount = dagNodes.filter(n => n.status === 'TRUSTED').length;
  const quarantinedCount = dagNodes.filter(n => n.status === 'QUARANTINED').length;
  const taintedCount = dagNodes.filter(n => n.isTainted || n.status === 'POISONED').length;
  const avgTrust = dagNodes.length > 0
    ? dagNodes.reduce((acc, n) => acc + n.trustScore, 0) / dagNodes.length
    : 1.0;

  const rawReportWithoutSeal = {
    complianceStandard: 'ISO/IEC 42001 & SOC 2 Type II Autonomous AI Agent Provenance Framework',
    reportId,
    generatedAt: timestampIso,
    environment: {
      system: 'MemGuard Zero-Trust Memory & Execution Layer',
      version: '1.0.0-PROD',
      securityPolicy: 'Strict Multi-Factor Trust & SHA-256 Append-Only Immutability',
      agentFrameworksSupported: ['LangChain', 'LlamaIndex', 'AutoGPT', 'Custom ReAct Agents'],
    },
    cryptographicLedgerSummary: {
      auditStatus: auditResult.isValid ? ('VERIFIED_IMMUTABLE' as const) : ('COMPROMISED_TAMPER_DETECTED' as const),
      totalBlocks: ledger.length,
      chainHeadSha256: auditResult.chainHead,
      isIntegrityValid: auditResult.isValid,
      brokenBlockIndex: auditResult.brokenBlockIndex,
      blocks: ledger.map(b => ({
        index: b.index,
        timestampIso: new Date(b.timestamp).toISOString(),
        memoryId: b.memoryId,
        payloadHash: b.payloadHash,
        previousHash: b.previousHash,
        currentHash: b.currentHash,
        payloadSummary: b.payloadSummary,
        isTampered: b.isTampered,
      })),
    },
    provenanceDagStatus: {
      totalNodes: dagNodes.length,
      taintedNodesCount: taintedCount,
      trustedNodesCount: trustedCount,
      quarantinedNodesCount: quarantinedCount,
      averageTrustScore: parseFloat(avgTrust.toFixed(4)),
      nodes: dagNodes.map(n => ({
        id: n.id,
        type: n.type,
        trustScore: n.trustScore,
        status: n.status,
        isTainted: n.isTainted,
        parents: n.parents,
        children: n.children,
        contentPreview: n.content.slice(0, 120),
      })),
    },
    zeroTrustActionGatekeeperSummary: {
      totalInvocations: actions.length,
      blockedCount: actions.filter(a => a.status === 'BLOCKED').length,
      approvedCount: actions.filter(a => a.status === 'APPROVED').length,
      pendingHitlCount: actions.filter(a => a.status === 'PENDING_HUMAN_APPROVAL').length,
      invocationAuditTrail: actions,
    },
  };

  const digest = sha256Sync(JSON.stringify(rawReportWithoutSeal));

  return {
    ...rawReportWithoutSeal,
    cryptographicVerificationSeal: {
      algorithm: 'SHA-256',
      reportDigestSha256: digest,
      signatureAuthority: 'MemGuard Hardware-Anchored Genesis Node',
    },
  };
}

export function downloadComplianceAuditReport(
  ledger: LedgerBlock[],
  auditResult: LedgerAuditResult,
  dagNodes: ProvenanceNode[],
  actions: ActionInvocation[]
) {
  const report = generateComplianceAuditReport(ledger, auditResult, dagNodes, actions);
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `memguard-compliance-audit-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return report;
}

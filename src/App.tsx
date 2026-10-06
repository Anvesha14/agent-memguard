/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { HackathonDemoFlow } from './components/HackathonDemoFlow';
import { LiveRadarLedgerStream } from './components/LiveRadarLedgerStream';
import { ProvenanceGraphVisualizer } from './components/ProvenanceGraphVisualizer';
import { CryptographicLedgerViewer } from './components/CryptographicLedgerViewer';
import { CustomIngestionSandbox } from './components/CustomIngestionSandbox';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { MemoryDetailModal } from './components/MemoryDetailModal';
import { HumanApprovalModal } from './components/HumanApprovalModal';
import { SearchThreatIntelModal } from './components/SearchThreatIntelModal';
import { VoiceSecurityOfficer } from './components/VoiceSecurityOfficer';
import { useTheme } from './context/ThemeContext';

import { LedgerGraphManager } from './lib/ledgerGraph';
import { ActionGuard } from './lib/actionGuard';
import { TrustEngine } from './lib/trustEngine';
import { runMultiTierScan, MultiTierScanResult } from './lib/poisonDetector';
import { createBaselineMemories, POISON_PAYLOAD_SAMPLE } from './lib/demoScenarios';
import { downloadComplianceAuditReport } from './lib/auditExport';
import {
  MemoryItem,
  LedgerBlock,
  ProvenanceNode,
  ActionInvocation,
  BlastRadiusReport,
  LedgerAuditResult,
  SourceType,
} from './lib/types';

export default function App() {
  const { isDark } = useTheme();

  // Core Singleton Engines
  const trustEngine = useMemo(() => new TrustEngine(), []);
  const ledgerGraph = useMemo(() => new LedgerGraphManager(), []);
  const actionGuard = useMemo(() => new ActionGuard(), []);

  // Application State
  const [activeTab, setActiveTab] = useState<string>('demo');
  const [threatLevel, setThreatLevel] = useState<'NOMINAL' | 'ATTACK_INTERCEPTED' | 'TAMPER_DETECTED'>('NOMINAL');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [dagNodes, setDagNodes] = useState<ProvenanceNode[]>([]);
  const [auditResult, setAuditResult] = useState<LedgerAuditResult>({
    isValid: true,
    totalBlocks: 0,
    brokenBlockIndex: null,
    expectedHash: null,
    actualHash: null,
    chainHead: '',
  });

  // Hackathon Demo Flow State
  const [demoStep, setDemoStep] = useState<number>(0);
  const [isScanningStep2, setIsScanningStep2] = useState<boolean>(false);
  const [step2ScanResult, setStep2ScanResult] = useState<MultiTierScanResult | null>(null);
  const [step3Action, setStep3Action] = useState<ActionInvocation | null>(null);
  const [step4PurgeReport, setStep4PurgeReport] = useState<BlastRadiusReport | null>(null);

  // Modals
  const [inspectedMemory, setInspectedMemory] = useState<MemoryItem | null>(null);
  const [hitlAction, setHitlAction] = useState<ActionInvocation | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('Acme Corp vendor routing DE89370400440532013000 vs KY44119988776655443322');

  // Sync state from engines
  const refreshState = useCallback(() => {
    setMemories(ledgerGraph.getMemories());
    setLedger(ledgerGraph.getLedger());
    setDagNodes(ledgerGraph.getDagNodes());
    const audit = ledgerGraph.auditLedgerIntegrity();
    setAuditResult(audit);
    if (!audit.isValid) {
      setThreatLevel('TAMPER_DETECTED');
    }
  }, [ledgerGraph]);

  // Initialize with baseline data
  const loadBaseline = useCallback(() => {
    ledgerGraph.takeSnapshot();
    const baseline = createBaselineMemories();
    for (const mem of baseline) {
      ledgerGraph.appendMemory(
        mem,
        mem.id.startsWith('BASE') ? 'raw_source' : 'derived_fact',
        mem.id
      );
    }
    setThreatLevel('NOMINAL');
    setDemoStep(1); // Baseline is loaded, next is Attack
    setStep2ScanResult(null);
    setStep3Action(null);
    setStep4PurgeReport(null);
    refreshState();
  }, [ledgerGraph, refreshState]);

  useEffect(() => {
    loadBaseline();
  }, [loadBaseline]);

  // STEP 1: Benign Baseline Load
  const handleExecuteStep1 = () => {
    loadBaseline();
  };

  // STEP 2: Ingest Poison Invoice
  const handleExecuteStep2 = async () => {
    setIsScanningStep2(true);
    try {
      // 1. Run multi-tier scan against current baseline memories
      const currentMems = ledgerGraph.getMemories();
      const scan = await runMultiTierScan(
        POISON_PAYLOAD_SAMPLE.content,
        currentMems,
        POISON_PAYLOAD_SAMPLE.source
      );
      setStep2ScanResult(scan);

      // 2. Ingest poisoned raw email node into ledger and DAG
      const poisonMemory: MemoryItem = {
        id: POISON_PAYLOAD_SAMPLE.id,
        content: POISON_PAYLOAD_SAMPLE.content,
        metadata: {
          source: POISON_PAYLOAD_SAMPLE.source,
          sourceType: POISON_PAYLOAD_SAMPLE.sourceType,
          sourceReliability: 0.70,
          corroborationCount: 1,
          createdAt: Date.now(),
          lastVerifiedAt: Date.now(),
          tags: POISON_PAYLOAD_SAMPLE.tags,
          entitySubject: 'Acme Corp Wire Routing Change',
        },
        parentIds: [],
        childrenIds: ['FACT-044'],
        rawTrustScore: 0.15,
        effectiveTrust: 0.15,
        decayFactor: 1.0,
        consistencyScore: scan.finalConsistencyMultiplier,
        status: scan.recommendedStatus,
        isTainted: true,
        taintReason: scan.riskSummary,
        ledgerIndex: 0,
        blockHash: '',
        previousHash: '',
      };

      ledgerGraph.appendMemory(poisonMemory, 'raw_source', POISON_PAYLOAD_SAMPLE.id);

      // 3. Simulate autonomous agent extracting the rogue IBAN into derived memory FACT-044
      const derivedFactMemory: MemoryItem = {
        id: 'FACT-044',
        content: 'Derived Extracted Fact: Acme Corp primary bank account switched to offshore IBAN KY44119988776655443322 (Swift: CAYMBW11) per Invoice #INV-8820.',
        metadata: {
          source: 'Autonomous Ingestion Agent (LLM Extractor)',
          sourceType: 'INTERNAL_REASONING',
          sourceReliability: 0.80,
          corroborationCount: 1,
          createdAt: Date.now() + 1000,
          lastVerifiedAt: Date.now() + 1000,
          tags: ['banking', 'derived_fact', 'acme_corp'],
          entitySubject: 'Updated Acme IBAN',
        },
        parentIds: [POISON_PAYLOAD_SAMPLE.id],
        childrenIds: ['PLAN-012'],
        rawTrustScore: 0.65,
        // Anti-Laundering Protocol enforces min(parent_trust) = 0.15
        effectiveTrust: 0.15,
        decayFactor: 1.0,
        consistencyScore: scan.finalConsistencyMultiplier,
        status: 'POISONED',
        isTainted: true,
        taintReason: `Inherited taint from parent ${POISON_PAYLOAD_SAMPLE.id} (Anti-Laundering Protocol enforced)`,
        ledgerIndex: 0,
        blockHash: '',
        previousHash: '',
      };

      ledgerGraph.appendMemory(derivedFactMemory, 'derived_fact', 'FACT-044');

      // 4. Create Agent Planning Node PLAN-012
      const planMemory: MemoryItem = {
        id: 'PLAN-012',
        content: 'Autonomous Agent Plan: Disburse $250,000 monthly invoice payment for Acme Corp to IBAN KY44119988776655443322.',
        metadata: {
          source: 'Autonomous Payment Planner Agent',
          sourceType: 'INTERNAL_REASONING',
          sourceReliability: 0.80,
          corroborationCount: 1,
          createdAt: Date.now() + 2000,
          lastVerifiedAt: Date.now() + 2000,
          tags: ['agent_plan', 'payout_staging'],
          entitySubject: 'Scheduled Disbursement',
        },
        parentIds: ['FACT-044'],
        childrenIds: ['ACT-001'],
        rawTrustScore: 0.70,
        effectiveTrust: 0.15, // Anti-Laundering inheritance
        decayFactor: 1.0,
        consistencyScore: scan.finalConsistencyMultiplier,
        status: 'POISONED',
        isTainted: true,
        taintReason: 'Inherited taint from FACT-044 (Weakest parent score 0.15)',
        ledgerIndex: 0,
        blockHash: '',
        previousHash: '',
      };

      ledgerGraph.appendMemory(planMemory, 'agent_plan', 'PLAN-012');

      setDemoStep(2); // Attack ingested, now trigger Action
      setThreatLevel('ATTACK_INTERCEPTED');
      refreshState();
    } finally {
      setIsScanningStep2(false);
    }
  };

  // STEP 3: Action Interception
  const handleExecuteStep3 = () => {
    // Stage Tool invocation in DAG
    const actionNode: MemoryItem = {
      id: 'ACT-PAYOUT',
      content: 'Tool Invocation: send_payment(amount: $250,000, recipient: "Acme Corp", iban: "KY44119988776655443322", memo: "INV-8820")',
      metadata: {
        source: 'Autonomous Agent Execution Engine',
        sourceType: 'INTERNAL_REASONING',
        sourceReliability: 0.80,
        corroborationCount: 1,
        createdAt: Date.now(),
        lastVerifiedAt: Date.now(),
        tags: ['tool_call', 'send_payment'],
      },
      parentIds: ['PLAN-012'],
      childrenIds: [],
      rawTrustScore: 0.50,
      effectiveTrust: 0.15,
      decayFactor: 1.0,
      consistencyScore: 0.15,
      status: 'POISONED',
      isTainted: true,
      taintReason: 'Inherited from tainted PLAN-012',
      ledgerIndex: 0,
      blockHash: '',
      previousHash: '',
    };
    ledgerGraph.appendMemory(actionNode, 'action_intent', 'ACT-PAYOUT');

    // Run Zero-Trust Action Guard evaluation
    const actionResult = actionGuard.evaluateAction(
      'send_payment',
      { amount: 250000, recipient: 'Acme Corp', iban: 'KY44119988776655443322' },
      'PLAN-012',
      ledgerGraph
    );

    setStep3Action(actionResult);
    setDemoStep(3); // Action blocked, now ready for Blast-Radius Purge
    refreshState();
  };

  // STEP 4: Blast-Radius Purge & Cryptographic Audit
  const handleExecuteStep4 = () => {
    const report = ledgerGraph.executeBlastRadiusPurge(POISON_PAYLOAD_SAMPLE.id);
    setStep4PurgeReport(report);
    setThreatLevel('NOMINAL');
    setDemoStep(4); // Purge complete
    refreshState();
  };

  // Custom Ingestion Sandbox Handler
  const handleCustomIngest = async (
    content: string,
    sourceType: SourceType,
    sourceReliability: number,
    corroborationCount: number,
    ageHours: number,
    parentIds: string[]
  ): Promise<MultiTierScanResult> => {
    const currentMems = ledgerGraph.getMemories();
    const scan = await runMultiTierScan(content, currentMems);

    const parentMems = parentIds.map((id) => ledgerGraph.getMemory(id)).filter(Boolean) as MemoryItem[];

    // Calculate Dynamic Trust
    const rawTrustCalc = trustEngine.calculateRawTrust(
      sourceReliability,
      corroborationCount,
      Date.now() - ageHours * 3600000,
      Date.now(),
      scan.finalConsistencyMultiplier
    );

    // Apply Anti-Laundering inheritance
    const inheritance = trustEngine.applyAntiLaunderingInheritance(
      rawTrustCalc.rawTrust,
      parentMems
    );

    const newId = `MEM-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const newMemory: MemoryItem = {
      id: newId,
      content,
      metadata: {
        source: `User Ingestion Console (${sourceType})`,
        sourceType,
        sourceReliability,
        corroborationCount,
        createdAt: Date.now() - ageHours * 3600000,
        lastVerifiedAt: Date.now(),
        tags: ['custom_ingest', sourceType.toLowerCase()],
      },
      parentIds,
      childrenIds: [],
      rawTrustScore: rawTrustCalc.rawTrust,
      effectiveTrust: inheritance.effectiveTrust,
      decayFactor: rawTrustCalc.decayFactor,
      consistencyScore: scan.finalConsistencyMultiplier,
      status: scan.recommendedStatus === 'POISONED' ? 'POISONED' : trustEngine.classifyStatus(inheritance.effectiveTrust, inheritance.isTainted),
      isTainted: inheritance.isTainted || scan.recommendedStatus === 'POISONED',
      taintReason: inheritance.taintReason || scan.riskSummary,
      ledgerIndex: 0,
      blockHash: '',
      previousHash: '',
    };

    ledgerGraph.appendMemory(newMemory, 'raw_source', newId);
    refreshState();
    return scan;
  };

  // Simulate Malicious Tampering in Ledger Storage
  const handleSimulateTamper = (blockIndex: number) => {
    ledgerGraph.simulateMaliciousTampering(blockIndex);
    const audit = ledgerGraph.auditLedgerIntegrity();
    setAuditResult(audit);
    setThreatLevel('TAMPER_DETECTED');
    refreshState();
  };

  // Re-audit Ledger
  const handleAuditLedger = () => {
    const audit = ledgerGraph.auditLedgerIntegrity();
    setAuditResult(audit);
    if (!audit.isValid) {
      setThreatLevel('TAMPER_DETECTED');
    } else {
      setThreatLevel('NOMINAL');
    }
  };

  // Restore Clean Chain from pre-attack snapshot
  const handleRestoreFromSnapshot = () => {
    ledgerGraph.rollbackToLatestSnapshot();
    setThreatLevel('NOMINAL');
    refreshState();
  };

  // Purge specific node from visualizer
  const handlePurgeSpecificNode = (nodeId: string) => {
    ledgerGraph.executeBlastRadiusPurge(nodeId);
    refreshState();
  };

  // Human Approval Modal Callbacks
  const handleApproveAction = (actionId: string, reason?: string) => {
    actionGuard.resolveHumanApproval(actionId, true, reason);
    setHitlAction(null);
    refreshState();
  };

  const handleRejectAction = (actionId: string, reason?: string) => {
    actionGuard.resolveHumanApproval(actionId, false, reason);
    setHitlAction(null);
    refreshState();
  };

  // Export Compliance Audit Log file
  const handleExportAudit = () => {
    downloadComplianceAuditReport(
      ledger,
      auditResult,
      dagNodes,
      actionGuard.getAuditLog()
    );
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Header */}
      <Header
        threatLevel={threatLevel}
        chainHeadHash={auditResult.chainHead || 'GENESIS_ROOT'}
        isLedgerValid={auditResult.isValid}
        onResetToBaseline={loadBaseline}
        onExportAudit={handleExportAudit}
        onOpenSearchIntel={() => setSearchModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards Row */}
        <MetricCards
          memories={memories}
          ledger={ledger}
          isLedgerValid={auditResult.isValid}
          actions={actionGuard.getAuditLog()}
          onOpenAuditTab={() => setActiveTab('ledger')}
        />

        {/* Tab 1: Hackathon Attack Simulator */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <HackathonDemoFlow
              currentStep={demoStep}
              onExecuteStep1={handleExecuteStep1}
              onExecuteStep2={handleExecuteStep2}
              onExecuteStep3={handleExecuteStep3}
              onExecuteStep4={handleExecuteStep4}
              isScanningStep2={isScanningStep2}
              step2ScanResult={step2ScanResult}
              step3Action={step3Action}
              step4PurgeReport={step4PurgeReport}
              onReset={loadBaseline}
            />

            {/* Accompanying DAG preview in Demo Tab */}
            <ProvenanceGraphVisualizer
              nodes={dagNodes}
              onPurgeNode={handlePurgeSpecificNode}
              onSelectNode={(node) => {
                const mem = ledgerGraph.getMemory(node.id);
                if (mem) setInspectedMemory(mem);
              }}
            />
          </div>
        )}

        {/* Tab 2: Security Radar & Stream */}
        {activeTab === 'dashboard' && (
          <LiveRadarLedgerStream
            memories={memories}
            onSelectMemory={(m) => setInspectedMemory(m)}
            onPurgeNode={handlePurgeSpecificNode}
          />
        )}

        {/* Tab 3: Provenance DAG Graph Visualizer */}
        {activeTab === 'graph' && (
          <ProvenanceGraphVisualizer
            nodes={dagNodes}
            onPurgeNode={handlePurgeSpecificNode}
            onSelectNode={(node) => {
              const mem = ledgerGraph.getMemory(node.id);
              if (mem) setInspectedMemory(mem);
            }}
          />
        )}

        {/* Tab 4: Cryptographic Ledger Audit */}
        {activeTab === 'ledger' && (
          <CryptographicLedgerViewer
            ledger={ledger}
            auditResult={auditResult}
            onAuditLedger={handleAuditLedger}
            onSimulateTamper={handleSimulateTamper}
            onRestoreFromSnapshot={handleRestoreFromSnapshot}
            onExportAudit={handleExportAudit}
          />
        )}

        {/* Tab 5: Multi-Tier Ingestion Sandbox */}
        {activeTab === 'sandbox' && (
          <CustomIngestionSandbox
            existingMemories={memories}
            onIngestMemory={handleCustomIngest}
          />
        )}

        {/* Tab 6: Voice Security Officer (Live API) */}
        {activeTab === 'voice' && <VoiceSecurityOfficer />}

        {/* Tab 7: Production Python Code Browser */}
        {activeTab === 'python' && <PythonCodeViewer />}
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 text-center text-xs font-mono transition-colors ${
        isDark ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-600'
      }`}>
        <p>
          MemGuard Zero-Trust Architecture • Dynamic Trust Formula: Trust = Source_Reliability × Corroboration × Time_Decay × Consistency
        </p>
        <p className={isDark ? 'text-slate-600 mt-1' : 'text-slate-500 mt-1'}>
          Cryptographic SHA-256 Chain Anchor • Gemini 3.8 Live API • Gemini 3.5 Flash Search Grounding • DAG Blast-Radius Purge Engine
        </p>
      </footer>

      {/* Modals */}
      <MemoryDetailModal
        memory={inspectedMemory}
        onClose={() => setInspectedMemory(null)}
        onPurgeNode={handlePurgeSpecificNode}
        onVerifyWithSearchGrounding={(q) => {
          setSearchQuery(q);
          setSearchModalOpen(true);
        }}
      />

      <SearchThreatIntelModal
        isOpen={searchModalOpen}
        initialQuery={searchQuery}
        onClose={() => setSearchModalOpen(false)}
      />

      <HumanApprovalModal
        action={hitlAction}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
        onClose={() => setHitlAction(null)}
      />
    </div>
  );
}

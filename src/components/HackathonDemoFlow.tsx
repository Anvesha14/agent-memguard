import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  FileText,
  DollarSign,
  Radio,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { DEMO_STEPS, POISON_PAYLOAD_SAMPLE } from '../lib/demoScenarios';
import { MultiTierScanResult } from '../lib/poisonDetector';
import { ActionInvocation, BlastRadiusReport } from '../lib/types';
import { useTheme } from '../context/ThemeContext';

interface HackathonDemoFlowProps {
  currentStep: number;
  onExecuteStep1: () => void;
  onExecuteStep2: () => Promise<void>;
  onExecuteStep3: () => void;
  onExecuteStep4: () => void;
  isScanningStep2: boolean;
  step2ScanResult: MultiTierScanResult | null;
  step3Action: ActionInvocation | null;
  step4PurgeReport: BlastRadiusReport | null;
  onReset: () => void;
}

export const HackathonDemoFlow: React.FC<HackathonDemoFlowProps> = ({
  currentStep,
  onExecuteStep1,
  onExecuteStep2,
  onExecuteStep3,
  onExecuteStep4,
  isScanningStep2,
  step2ScanResult,
  step3Action,
  step4PurgeReport,
  onReset,
}) => {
  const { isDark } = useTheme();
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  return (
    <div className={`border rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md text-slate-900'
    }`}>
      {/* Background cyber accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-6 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-cyan-950 border-cyan-800/60 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}>
              <Zap className="w-4 h-4" />
            </span>
            <h2 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              INTERACTIVE ATTACK & ROLLBACK SIMULATOR
            </h2>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            4-Step Autonomous Agent Security Scenario: The "Trojan Vendor Invoice" Poison Attack
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
            isDark ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40' : 'text-cyan-800 bg-cyan-50 border-cyan-300'
          }`}>
            Step {Math.min(currentStep + 1, 4)} of 4 Active
          </span>
          <button
            onClick={onReset}
            className={`text-xs flex items-center gap-1 px-3 py-1 rounded-md transition cursor-pointer border ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restart Flow
          </button>
        </div>
      </div>

      {/* Stepper Progression Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-6">
        {DEMO_STEPS.map((step, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isUpcoming = currentStep < idx;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all relative ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-200'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                  Phase 0{step.stepNumber}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <h4 className="text-xs font-bold font-mono text-slate-200 line-clamp-1">{step.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{step.shortDescription}</p>
            </div>
          );
        })}
      </div>

      {/* Interactive Step Action Panels */}
      <div className="space-y-4">
        {/* Step 1: Benign Load */}
        <div className={`p-4 rounded-xl border transition-all ${
          currentStep === 0
            ? 'bg-slate-950 border-cyan-500/40'
            : currentStep > 0
            ? 'bg-slate-950/50 border-slate-800 text-slate-400'
            : 'opacity-50 pointer-events-none border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-lg font-mono text-xs font-bold ${
                currentStep > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                01
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Toggle 1: Ingest Benign Corporate Baseline</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Loads Oracle ERP verified supplier profile for Acme Corp with destination IBAN: <code className="text-cyan-300 font-mono">DE89370400440532013000</code> and CFO policy.
                </p>
              </div>
            </div>

            <button
              onClick={onExecuteStep1}
              disabled={currentStep > 0}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                currentStep > 0
                  ? 'bg-slate-800 text-slate-400 cursor-default'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              }`}
            >
              {currentStep > 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Baseline Active
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Load Baseline Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Poison Attack */}
        <div className={`p-4 rounded-xl border transition-all ${
          currentStep === 1
            ? 'bg-slate-950 border-amber-500/40'
            : currentStep > 1
            ? 'bg-slate-950/50 border-slate-800 text-slate-400'
            : 'opacity-50 pointer-events-none border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-lg font-mono text-xs font-bold ${
                currentStep > 1 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                02
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Toggle 2: Inject Poisoned Vendor Invoice with Indirect Injection</span>
                  <button
                    onClick={() => setShowInvoicePreview(!showInvoicePreview)}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
                  >
                    <Eye className="w-3 h-3" /> {showInvoicePreview ? 'Hide Payload' : 'Inspect Payload'}
                  </button>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adversary sends an invoice email attempting to switch payout IBAN to <code className="text-rose-400 font-mono">KY44119988776655443322</code> and injects command overrides.
                </p>
              </div>
            </div>

            <button
              onClick={onExecuteStep2}
              disabled={currentStep !== 1 || isScanningStep2}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                currentStep > 1
                  ? 'bg-slate-800 text-rose-400 cursor-default'
                  : currentStep === 1
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isScanningStep2 ? (
                <>
                  <Radio className="w-3.5 h-3.5 animate-spin" /> Scanning Multi-Tier...
                </>
              ) : currentStep > 1 ? (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> Attack Flagged & Ingested
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Ingest Adversarial Invoice
                </>
              )}
            </button>
          </div>

          {/* Collapsible invoice preview */}
          {showInvoicePreview && (
            <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
              <div className="text-slate-400 mb-1 border-b border-slate-800 pb-1">
                Subject: {POISON_PAYLOAD_SAMPLE.subject}
              </div>
              <div className="whitespace-pre-wrap text-slate-300">
                {POISON_PAYLOAD_SAMPLE.content}
              </div>
            </div>
          )}

          {/* Scan result breakdown if step 2 completed */}
          {step2ScanResult && (
            <div className="mt-3 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs">
              <div className="flex items-center justify-between font-mono text-rose-300 font-semibold mb-1">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> {step2ScanResult.riskSummary}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-900/60 text-[10px]">
                  STATUS: {step2ScanResult.recommendedStatus}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[11px] text-slate-300 font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Tier 1 Regex:</span>
                  <span className={step2ScanResult.heuristic.hasOvertInjection ? 'text-rose-400' : 'text-emerald-400'}>
                    {step2ScanResult.heuristic.hasOvertInjection ? step2ScanResult.heuristic.patternsDetected.join(', ') : 'No overt commands'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Tier 2 Gemini LLM:</span>
                  <span className={step2ScanResult.covert.isCovertInjection ? 'text-rose-400' : 'text-emerald-400'}>
                    {step2ScanResult.covert.threatType} ({Math.round(step2ScanResult.covert.confidenceScore * 100)}%)
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Tier 3 Contradiction:</span>
                  <span className={step2ScanResult.contradiction.isContradiction ? 'text-amber-400' : 'text-emerald-400'}>
                    {step2ScanResult.contradiction.isContradiction ? 'IBAN Mismatch vs BASE-001' : 'Consistent'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Action Interception */}
        <div className={`p-4 rounded-xl border transition-all ${
          currentStep === 2
            ? 'bg-slate-950 border-rose-500/40'
            : currentStep > 2
            ? 'bg-slate-950/50 border-slate-800 text-slate-400'
            : 'opacity-50 pointer-events-none border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-lg font-mono text-xs font-bold ${
                currentStep > 2 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300'
              }`}>
                03
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Toggle 3: Autonomous Agent Attempts Payout Execution</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous agent reads email, forms plan <code className="text-amber-300 font-mono">PLAN-012</code>, and attempts to execute <code className="text-rose-300 font-mono">send_payment($250,000, "KY44119988776655443322")</code>.
                </p>
              </div>
            </div>

            <button
              onClick={onExecuteStep3}
              disabled={currentStep !== 2}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                currentStep > 2
                  ? 'bg-slate-800 text-slate-400 cursor-default'
                  : currentStep === 2
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)] animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > 2 ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Action Intercepted & Blocked
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Trigger Agent Payout
                </>
              )}
            </button>
          </div>

          {step3Action && (
            <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-600/50 text-xs font-mono">
              <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  MEMGUARD ACTION GATEKEEPER INTERCEPTED CALL
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-900 text-[10px] text-white">
                  STATUS: {step3Action.status}
                </span>
              </div>
              <p className="text-slate-300 mt-1">
                <span className="text-rose-400 font-semibold">Violation: </span>
                {step3Action.blockReason}
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                Attempted Tool: <span className="text-cyan-300">{step3Action.toolName}</span> | Lineage Trust:{' '}
                <span className="text-rose-400 font-bold">{(step3Action.evaluatedTrust * 100).toFixed(0)}%</span> (Required: 85%) |
                Tainted Ancestor: <span className="text-rose-400">{step3Action.taintedAncestors.join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Cryptographic Audit & Blast-Radius Purge */}
        <div className={`p-4 rounded-xl border transition-all ${
          currentStep === 3
            ? 'bg-slate-950 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
            : currentStep > 3
            ? 'bg-slate-950/50 border-emerald-500/40'
            : 'opacity-50 pointer-events-none border-slate-800'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`p-2 rounded-lg font-mono text-xs font-bold ${
                currentStep > 3 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                04
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Toggle 4: Blast-Radius Purge & Cryptographic Audit</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Traverses the DAG lineage from <code className="text-rose-400 font-mono">EML-102</code>, severs all derived poisoned nodes, appends cryptographic tombstone block, and re-verifies ledger.
                </p>
              </div>
            </div>

            <button
              onClick={onExecuteStep4}
              disabled={currentStep !== 3}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                currentStep > 3
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                  : currentStep === 3
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > 3 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Purge Executed & Verified
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-950 fill-rose-950" /> Execute Blast-Radius Purge
                </>
              )}
            </button>
          </div>

          {step4PurgeReport && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs font-mono">
              <div className="flex items-center justify-between text-emerald-300 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  BLAST-RADIUS PURGE SUCCESSFUL
                </span>
                <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
                  LEDGER HEAD SECURED
                </span>
              </div>
              <p className="text-slate-300">
                Purged <span className="text-emerald-400 font-bold">{step4PurgeReport.taintedNodeIds.length}</span> contaminated nodes: [
                {step4PurgeReport.taintedNodeIds.join(', ')}].
              </p>
              <p className="text-slate-400 text-[11px] mt-1">
                Cryptographic Tombstone block appended to SHA-256 ledger. Pre-attack memory integrity verified.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

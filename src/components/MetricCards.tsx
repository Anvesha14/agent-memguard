import React from 'react';
import { Database, ShieldCheck, ShieldAlert, Ban, TrendingDown, CheckCircle2, XCircle } from 'lucide-react';
import { MemoryItem, LedgerBlock, ActionInvocation } from '../lib/types';
import { useTheme } from '../context/ThemeContext';

interface MetricCardsProps {
  memories: MemoryItem[];
  ledger: LedgerBlock[];
  isLedgerValid: boolean;
  actions: ActionInvocation[];
  onOpenAuditTab: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  memories,
  ledger,
  isLedgerValid,
  actions,
  onOpenAuditTab,
}) => {
  const { isDark } = useTheme();

  const trustedCount = memories.filter(m => m.status === 'TRUSTED').length;
  const quarantinedCount = memories.filter(m => m.status === 'QUARANTINED').length;
  const poisonedCount = memories.filter(m => m.status === 'POISONED').length;

  const blockedActionsCount = actions.filter(a => a.status === 'BLOCKED').length;
  const pendingHumanCount = actions.filter(a => a.status === 'PENDING_HUMAN_APPROVAL').length;

  const avgTrust = memories.length > 0
    ? (memories.reduce((acc, m) => acc + m.effectiveTrust, 0) / memories.length)
    : 1.0;

  const cardBase = isDark
    ? 'bg-slate-900/70 border-slate-800 text-slate-100 hover:border-slate-700'
    : 'bg-white border-slate-200 text-slate-800 shadow-sm hover:border-slate-300';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Memory Items */}
      <div className={`${cardBase} border rounded-xl p-4 shadow-sm relative overflow-hidden group transition`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Active Memories
          </span>
          <Database className="w-4 h-4 text-cyan-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {memories.length}
          </span>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>records in DAG</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
            isDark ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {trustedCount} Trusted
          </span>
          {quarantinedCount > 0 && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
              isDark ? 'text-amber-400 bg-amber-950/60 border-amber-800/40' : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {quarantinedCount} Quarantined
            </span>
          )}
          {poisonedCount > 0 && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border animate-pulse ${
              isDark ? 'text-rose-400 bg-rose-950/60 border-rose-800/40' : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {poisonedCount} Poisoned
            </span>
          )}
        </div>
      </div>

      {/* Cryptographic Ledger State */}
      <div
        onClick={onOpenAuditTab}
        className={`border rounded-xl p-4 shadow-sm cursor-pointer transition relative overflow-hidden ${
          isLedgerValid
            ? isDark
              ? 'bg-slate-900/70 border-slate-800 hover:border-cyan-800/60'
              : 'bg-white border-slate-200 hover:border-cyan-500/60 shadow-sm'
            : isDark
            ? 'bg-rose-950/30 border-rose-700/60 hover:border-rose-600'
            : 'bg-rose-50 border-rose-300 hover:border-rose-400 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Ledger Integrity
          </span>
          {isLedgerValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500 animate-bounce" />
          )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${
            isLedgerValid
              ? isDark ? 'text-emerald-300' : 'text-emerald-700'
              : isDark ? 'text-rose-400' : 'text-rose-700'
          }`}>
            {isLedgerValid ? 'VALID' : 'TAMPERED'}
          </span>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({ledger.length} blocks)</span>
        </div>
        <p className={`mt-3 text-xs flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>SHA-256 Chain Head</span>
          <span className="text-cyan-500 underline font-mono text-[11px]">Audit Chain &rarr;</span>
        </p>
      </div>

      {/* Blocked Actions / Gatekeeper */}
      <div className={`${cardBase} border rounded-xl p-4 shadow-sm relative overflow-hidden group transition`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Zero-Trust Intercepts
          </span>
          <Ban className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {blockedActionsCount}
          </span>
          <span className="text-xs text-rose-500 font-medium">high-risk actions blocked</span>
        </div>
        <div className={`mt-3 text-xs flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>HITL Queued:</span>
          <span className={`px-2 py-0.5 rounded font-mono ${
            pendingHumanCount > 0
              ? isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-300'
              : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {pendingHumanCount} awaiting review
          </span>
        </div>
      </div>

      {/* Average Lineage Trust Score */}
      <div className={`${cardBase} border rounded-xl p-4 shadow-sm relative overflow-hidden group transition`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Avg Effective Trust
          </span>
          <TrendingDown className="w-4 h-4 text-cyan-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${
            avgTrust >= 0.8 ? 'text-emerald-500' : avgTrust >= 0.5 ? 'text-amber-500' : 'text-rose-500'
          }`}>
            {(avgTrust * 100).toFixed(1)}%
          </span>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>across active DAG</span>
        </div>
        <div className={`mt-3 w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
          <div
            className={`h-full transition-all duration-500 ${
              avgTrust >= 0.8 ? 'bg-emerald-500' : avgTrust >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, avgTrust * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

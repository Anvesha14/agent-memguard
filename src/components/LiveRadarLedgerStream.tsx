import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Flame,
  Clock,
  Link,
  Shield,
  Layers,
  Fingerprint,
  Info,
  ArrowRight,
} from 'lucide-react';
import { MemoryItem } from '../lib/types';
import { useTheme } from '../context/ThemeContext';

interface LiveRadarLedgerStreamProps {
  memories: MemoryItem[];
  onSelectMemory: (memory: MemoryItem) => void;
  onPurgeNode?: (id: string) => void;
}

export const LiveRadarLedgerStream: React.FC<LiveRadarLedgerStreamProps> = ({
  memories,
  onSelectMemory,
  onPurgeNode,
}) => {
  const { isDark } = useTheme();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('ALL');

  const filteredMemories = memories.filter((m) => {
    if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
    if (selectedSourceType !== 'ALL' && m.metadata.sourceType !== selectedSourceType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        m.id.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.metadata.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className={`border rounded-2xl p-6 shadow-xl space-y-5 transition-colors ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md text-slate-900'
    }`}>
      {/* Top Title & Filters */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-emerald-950 border-emerald-800/60 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <Shield className="w-4 h-4" />
            </span>
            <h3 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              LIVE MEMORY TRUST RADAR & INGESTION STREAM
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time feed with multi-factor trust calculation & anti-laundering inheritance
          </p>
        </div>

        {/* Search & Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search content or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44 sm:w-56 border ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            {['ALL', 'TRUSTED', 'QUARANTINED', 'POISONED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition cursor-pointer ${
                  filterStatus === st
                    ? st === 'TRUSTED'
                      ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800'
                      : st === 'QUARANTINED'
                      ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800'
                      : st === 'POISONED'
                      ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800'
                      : 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Stream Cards */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No memories match current filter criteria.
          </div>
        ) : (
          filteredMemories.map((m) => {
            const isTrusted = m.status === 'TRUSTED';
            const isQuarantined = m.status === 'QUARANTINED';
            const isPoisoned = m.status === 'POISONED';

            return (
              <div
                key={m.id}
                onClick={() => onSelectMemory(m)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                  isTrusted
                    ? 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/50'
                    : isQuarantined
                    ? 'bg-amber-950/20 border-amber-800/50 hover:border-amber-600'
                    : 'bg-rose-950/30 border-rose-800/60 hover:border-rose-600'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {m.id}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                      {m.metadata.sourceType}
                    </span>
                    {m.parentIds.length > 0 && (
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Link className="w-3 h-3 text-cyan-400" />
                        derived from {m.parentIds.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Trust Badge */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${
                      isTrusted
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : isQuarantined
                        ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                        : 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
                    }`}>
                      {isTrusted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      {isQuarantined && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {isPoisoned && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{(m.effectiveTrust * 100).toFixed(0)}% TRUST</span>
                    </div>

                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {m.status}
                    </span>
                  </div>
                </div>

                {/* Content Payload */}
                <p className="mt-2.5 text-xs text-slate-200 line-clamp-2 font-sans">
                  {m.content}
                </p>

                {/* Mathematical Trust Formula Breakdown Pill */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                  <span className="text-slate-500">Formula Breakdown:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Reliability: {m.metadata.sourceReliability.toFixed(2)}
                  </span>
                  <span>×</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Corroboration: {m.metadata.corroborationCount} src
                  </span>
                  <span>×</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Decay: {(m.decayFactor * 100).toFixed(0)}%
                  </span>
                  <span>×</span>
                  <span className={`px-1.5 py-0.5 rounded border ${
                    m.consistencyScore < 0.5
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}>
                    Consistency: {m.consistencyScore.toFixed(2)}
                  </span>

                  {/* SHA-256 Ledger info */}
                  <div className="ml-auto flex items-center gap-1.5 text-slate-500">
                    <Fingerprint className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px]">Block #{m.ledgerIndex}</span>
                  </div>
                </div>

                {/* Taint reason banner if present */}
                {m.isTainted && m.taintReason && (
                  <div className="mt-2 text-[11px] font-mono text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/40">
                    ⚠️ {m.taintReason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

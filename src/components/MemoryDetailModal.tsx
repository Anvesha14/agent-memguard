import React from 'react';
import { X, Shield, Link, KeyRound, Clock, AlertTriangle, Flame, CheckCircle, Globe } from 'lucide-react';
import { MemoryItem } from '../lib/types';

interface MemoryDetailModalProps {
  memory: MemoryItem | null;
  onClose: () => void;
  onPurgeNode?: (id: string) => void;
  onVerifyWithSearchGrounding?: (query: string) => void;
}

export const MemoryDetailModal: React.FC<MemoryDetailModalProps> = ({
  memory,
  onClose,
  onPurgeNode,
  onVerifyWithSearchGrounding,
}) => {
  if (!memory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2.5 py-1 rounded">
              {memory.id}
            </span>
            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
              memory.status === 'TRUSTED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : memory.status === 'QUARANTINED'
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
            }`}>
              {memory.status} ({(memory.effectiveTrust * 100).toFixed(1)}%)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-mono text-slate-400">Payload Content:</label>
            {onVerifyWithSearchGrounding && (
              <button
                onClick={() => onVerifyWithSearchGrounding(memory.content.slice(0, 150))}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Globe className="w-3 h-3" /> Verify via Google Search Grounding &rarr;
              </button>
            )}
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap">
            {memory.content}
          </div>
        </div>

        {/* Math Trust Components Grid */}
        <div>
          <label className="text-xs font-mono text-slate-400 block mb-1.5">
            Dynamic Trust Formula Parameters:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">SOURCE RELIABILITY</span>
              <span className="text-cyan-300 font-bold">{memory.metadata.sourceReliability.toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">CORROBORATION</span>
              <span className="text-cyan-300 font-bold">{memory.metadata.corroborationCount} sources</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">TIME DECAY FACTOR</span>
              <span className="text-cyan-300 font-bold">{(memory.decayFactor * 100).toFixed(1)}%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">CONSISTENCY SCORE</span>
              <span className={`font-bold ${memory.consistencyScore < 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {memory.consistencyScore.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Cryptographic Ledger Record */}
        <div>
          <label className="text-xs font-mono text-slate-400 block mb-1">
            SHA-256 Ledger Block Record:
          </label>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Ledger Block Index:</span>
              <span className="text-white">#{memory.ledgerIndex}</span>
            </div>
            <div className="text-slate-400">
              <span>Block Hash: </span>
              <span className="text-cyan-300 break-all">{memory.blockHash || 'GENESIS_ANCHORED'}</span>
            </div>
            <div className="text-slate-400">
              <span>Previous Hash: </span>
              <span className="text-slate-500 break-all">{memory.previousHash || 'GENESIS_ROOT'}</span>
            </div>
          </div>
        </div>

        {/* Taint Details & Action */}
        {memory.isTainted && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs font-mono text-rose-300 flex items-center justify-between">
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" /> TAINT DETECTED
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">{memory.taintReason || 'Contaminated memory ancestor'}</p>
            </div>
            {onPurgeNode && (
              <button
                onClick={() => {
                  onPurgeNode(memory.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition cursor-pointer"
              >
                Purge Node
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

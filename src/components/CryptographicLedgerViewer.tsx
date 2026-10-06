import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Bug,
  Fingerprint,
  ArrowDown,
  FileDown,
  FileCheck,
} from 'lucide-react';
import { LedgerBlock, LedgerAuditResult } from '../lib/types';
import { useTheme } from '../context/ThemeContext';

interface CryptographicLedgerViewerProps {
  ledger: LedgerBlock[];
  auditResult: LedgerAuditResult;
  onAuditLedger: () => void;
  onSimulateTamper: (blockIndex: number) => void;
  onRestoreFromSnapshot: () => void;
  onExportAudit?: () => void;
}

export const CryptographicLedgerViewer: React.FC<CryptographicLedgerViewerProps> = ({
  ledger,
  auditResult,
  onAuditLedger,
  onSimulateTamper,
  onRestoreFromSnapshot,
  onExportAudit,
}) => {
  const { isDark } = useTheme();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-xl space-y-6 transition-colors ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md text-slate-900'
    }`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-cyan-950 border-cyan-800/60 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}>
              <KeyRound className="w-4 h-4" />
            </span>
            <h3 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              TAMPER-EVIDENT CRYPTOGRAPHIC SHA-256 LEDGER
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Append-only cryptographic hash chaining: SHA-256(Block Payload + Previous Hash). Any database alteration invalidates chain head.
          </p>
        </div>

        {/* Audit & Tamper Simulation Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onExportAudit && (
            <button
              onClick={onExportAudit}
              className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              title="Download ISO 42001 & SOC 2 JSON compliance audit log file"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Compliance Audit (.json)</span>
            </button>
          )}

          <button
            onClick={onAuditLedger}
            className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Chain Integrity</span>
          </button>

          <button
            onClick={() => onSimulateTamper(1)}
            disabled={ledger.length <= 1}
            className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate DB Tampering (Block #1)</span>
          </button>

          <button
            onClick={onRestoreFromSnapshot}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore Clean Chain</span>
          </button>
        </div>
      </div>

      {/* Audit Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs ${
        auditResult.isValid
          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
          : 'bg-rose-950/50 border-rose-600 text-rose-300 animate-pulse'
      }`}>
        <div className="flex items-center gap-3">
          {auditResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div>
            <div className="font-bold text-sm">
              {auditResult.isValid
                ? 'CRYPTOGRAPHIC CHAIN VERIFIED: 100% IMMUTABLE'
                : `TAMPER DETECTED AT BLOCK #${auditResult.brokenBlockIndex}! HASH CHAIN BROKEN`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {auditResult.isValid
                ? `All ${auditResult.totalBlocks} blocks cryptographically linked to Genesis Root.`
                : `Stored previous hash does not match previous block's SHA-256 seal. Zero-trust enforcement halted ledger commits.`}
            </div>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-[10px] text-slate-500 uppercase">Chain Head</div>
          <div className="text-cyan-300 text-xs font-mono">
            {auditResult.chainHead.slice(0, 8)}...{auditResult.chainHead.slice(-6)}
          </div>
        </div>
      </div>

      {/* Visual Chain Blocks Feed */}
      <div className="space-y-4">
        {ledger.map((block, idx) => {
          const isBroken =
            !auditResult.isValid &&
            auditResult.brokenBlockIndex !== null &&
            idx >= auditResult.brokenBlockIndex;

          return (
            <div key={block.index} className="relative">
              {/* Downward link connector */}
              {idx > 0 && (
                <div className="flex justify-center -my-2 relative z-10">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono flex items-center gap-1 border ${
                    isBroken
                      ? 'bg-rose-950 text-rose-300 border-rose-700 animate-bounce'
                      : 'bg-slate-900 text-cyan-400 border-cyan-900/60'
                  }`}>
                    <ArrowDown className="w-3 h-3" />
                    <span>{isBroken ? 'BROKEN HASH LINK' : 'SHA-256 LINKED'}</span>
                  </div>
                </div>
              )}

              {/* Block Card */}
              <div className={`p-4 rounded-xl border font-mono transition-all relative ${
                isBroken
                  ? 'bg-rose-950/40 border-rose-700/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                  : block.index === 0
                  ? 'bg-slate-950 border-cyan-700/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                {/* Block Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      isBroken
                        ? 'bg-rose-900 text-white'
                        : block.index === 0
                        ? 'bg-cyan-900 text-cyan-200'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      BLOCK #{block.index}
                    </span>
                    <span className="text-xs text-white font-semibold">{block.memoryId}</span>
                    {block.isTampered && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-bold animate-pulse">
                        MANUALLY TAMPERED IN DB
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500">
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-300 mt-2 font-sans">
                  {block.payloadSummary}
                </p>

                {/* Cryptographic Hashes Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-2 border-t border-slate-900 text-[11px]">
                  {/* Previous Hash */}
                  <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">PREVIOUS BLOCK HASH:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-slate-400 truncate" title={block.previousHash}>
                        {block.previousHash}
                      </span>
                      <button
                        onClick={() => copyToClipboard(block.previousHash)}
                        className="text-slate-500 hover:text-cyan-400 ml-2"
                      >
                        {copiedHash === block.previousHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Current Block Hash */}
                  <div className={`p-2 rounded border ${
                    isBroken
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : 'bg-slate-900/90 border-slate-800/80 text-cyan-300'
                  }`}>
                    <span className="text-slate-500 block text-[10px]">CURRENT BLOCK HASH:</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="truncate" title={block.currentHash}>
                        {block.currentHash}
                      </span>
                      <button
                        onClick={() => copyToClipboard(block.currentHash)}
                        className="text-slate-500 hover:text-cyan-400 ml-2"
                      >
                        {copiedHash === block.currentHash ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  KeyRound,
  RefreshCw,
  AlertTriangle,
  Download,
  FileDown,
  Globe,
  Mic,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  threatLevel: 'NOMINAL' | 'ATTACK_INTERCEPTED' | 'TAMPER_DETECTED';
  chainHeadHash: string;
  isLedgerValid: boolean;
  onResetToBaseline: () => void;
  onExportAudit: () => void;
  onOpenSearchIntel: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  threatLevel,
  chainHeadHash,
  isLedgerValid,
  onResetToBaseline,
  onExportAudit,
  onOpenSearchIntel,
  activeTab,
  onSelectTab,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const tabs = [
    { id: 'dashboard', label: 'Security Radar & Stream' },
    { id: 'graph', label: 'Provenance DAG Visualizer' },
    { id: 'demo', label: 'Hackathon Attack Simulator' },
    { id: 'ledger', label: 'Cryptographic Ledger Audit' },
    { id: 'sandbox', label: 'Multi-Tier Ingestion Sandbox' },
    { id: 'voice', label: 'Voice Co-Pilot (Live API)' },
    { id: 'python', label: 'Python Engine & Code' },
  ];

  return (
    <header className={`border-b sticky top-0 z-40 backdrop-blur transition-colors ${
      isDark ? 'border-cyan-900/40 bg-slate-950/90' : 'border-slate-200 bg-white/95 shadow-sm'
    }`}>
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className={`relative flex items-center justify-center w-10 h-10 rounded-lg border transition ${
            isDark
              ? 'bg-cyan-950 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'bg-cyan-50 border-cyan-300 text-cyan-600 shadow-sm'
          }`}>
            <Shield className="w-6 h-6 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                MEM<span className="text-cyan-500">GUARD</span>
              </h1>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold tracking-wider ${
                isDark
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                  : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
              }`}>
                v1.0 Zero-Trust
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Trust-Aware, Tamper-Evident Memory & Execution Layer for Autonomous AI Agents
            </p>
          </div>
        </div>

        {/* Live Security Indicators */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          {/* Threat Level */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
            threatLevel === 'NOMINAL'
              ? isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : threatLevel === 'ATTACK_INTERCEPTED'
              ? isDark ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700'
              : isDark ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 animate-pulse' : 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
          }`}>
            {threatLevel === 'NOMINAL' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
            {threatLevel === 'ATTACK_INTERCEPTED' && <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />}
            {threatLevel === 'TAMPER_DETECTED' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
            <span className="font-semibold">THREAT: {threatLevel}</span>
          </div>

          {/* Ledger Hash Status */}
          <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
            isLedgerValid
              ? isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              : isDark ? 'bg-rose-950/50 border-rose-700/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <KeyRound className="w-3.5 h-3.5 text-cyan-500" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>HEAD:</span>
            <span className={`font-mono ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`} title={chainHeadHash}>
              {chainHeadHash.slice(0, 10)}...{chainHeadHash.slice(-6)}
            </span>
            <span className={`w-2 h-2 rounded-full ${isLedgerValid ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
          </div>

          {/* Google Search Grounding Button */}
          <button
            onClick={onOpenSearchIntel}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer font-medium ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-850 text-cyan-300 border-slate-700 hover:border-cyan-500/60'
                : 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-200'
            }`}
            title="Google Search Grounded Threat Intel Check"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            <span>Search Intel</span>
          </button>

          {/* Export Compliance Audit Log */}
          <button
            onClick={onExportAudit}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer font-medium ${
              isDark
                ? 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-700/60'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
            }`}
            title="Export downloadable compliance JSON audit report"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-500" />
            <span>Export Audit</span>
          </button>

          {/* Day / Night Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer font-medium ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
            title={isDark ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Day</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline">Night</span>
              </>
            )}
          </button>

          {/* Reset Baseline */}
          <button
            onClick={onResetToBaseline}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border transition cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Reset to clean baseline state"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto border-t no-scrollbar ${
        isDark ? 'border-slate-900/80' : 'border-slate-200'
      }`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? isDark
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                    : 'border-cyan-600 text-cyan-700 bg-cyan-50'
                  : isDark
                  ? 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};


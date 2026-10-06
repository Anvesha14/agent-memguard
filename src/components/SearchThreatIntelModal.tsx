import React, { useState } from 'react';
import { Search, Globe, ExternalLink, ShieldCheck, ShieldAlert, X, Radio, Sparkles } from 'lucide-react';

interface SearchThreatIntelModalProps {
  initialQuery?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchGroundingResponse {
  model: string;
  groundedTool: string;
  query: string;
  assessment: string;
  sources: Array<{ title: string; uri: string }>;
  timestamp: string;
}

export const SearchThreatIntelModal: React.FC<SearchThreatIntelModalProps> = ({
  initialQuery = 'Acme Corp vendor routing DE89370400440532013000 vs KY44119988776655443322',
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchGroundingResponse | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/search-grounded-threat-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Search grounding error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-400">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  GOOGLE SEARCH GROUNDED THREAT INTELLIGENCE
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                  gemini-3.5-flash
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live Google Search grounding tool to corroborate external entities, domains, and wire routes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Query Input */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threat intelligence, IBAN jurisdiction, or phishing domains..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-24 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Radio className="w-3.5 h-3.5 animate-spin" /> Grounding...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Search
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Quick Queries:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('Acme Corp authorized IBAN German branch vs Cayman routing');
              }}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 transition"
            >
              Acme Bank Check
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('KY44119988776655443322 wire fraud Business Email Compromise');
              }}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-300 transition"
            >
              Check Rogue IBAN
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('Latest indirect prompt injection benchmarks autonomous agent security');
              }}
              className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            >
              Agent Injection CVEs
            </button>
          </div>
        </form>

        {/* Results Container */}
        {result && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Grounded Assessment:
              </span>
              <span className="text-[10px] text-slate-500">
                Model: {result.model} • Tool: {result.groundedTool}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              {result.assessment}
            </p>

            {/* Web Source Links from Grounding Chunks */}
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-2">
                Grounding Sources & Citations ({result.sources.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-700/60 transition flex items-start justify-between gap-2 group"
                  >
                    <div className="truncate">
                      <span className="text-xs text-slate-200 group-hover:text-cyan-300 font-medium block truncate">
                        {src.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate block">
                        {src.uri}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

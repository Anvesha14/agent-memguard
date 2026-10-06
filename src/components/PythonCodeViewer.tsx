import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Code2,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';
import { PYTHON_CODE_FILES } from '../lib/pythonCodeStore';
import { useTheme } from '../context/ThemeContext';

export const PythonCodeViewer: React.FC = () => {
  const { isDark } = useTheme();
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const activeFile = PYTHON_CODE_FILES[activeFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([activeFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.fileName.split('/').pop() || 'script.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              <Code2 className="w-4 h-4" />
            </span>
            <h3 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              PRODUCTION PYTHON IMPLEMENTATION (FASTAPI / STREAMLIT / NETWORKX)
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Modular, out-of-the-box Python codebase implementing MemGuard's core trust engine, poison detector, and zero-trust action gatekeeper
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownloadFile}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeFile.fileName.split('/').pop()}</span>
          </button>
        </div>
      </div>

      {/* File Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: File Tree List */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Project Structure</span>
          </div>

          {PYTHON_CODE_FILES.map((file, idx) => {
            const isActive = activeFileIndex === idx;
            return (
              <button
                key={file.filePath}
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-400/80 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-mono font-bold text-white truncate">
                    {file.fileName}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                  <span>{file.category}</span>
                </div>
              </button>
            );
          })}

          {/* Quick CLI Execution Command Box */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 mt-4">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
              <Terminal className="w-3.5 h-3.5" /> Run Locally
            </div>
            <code className="text-[11px] text-slate-300 block bg-slate-900 p-2 rounded border border-slate-800 mt-1 select-all">
              pip install streamlit google-genai networkx pandas<br />
              streamlit run python/app.py
            </code>
          </div>
        </div>

        {/* Right: Code Syntax View Area */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-t-xl border border-slate-800 text-xs font-mono">
            <span className="text-cyan-300 font-bold">{activeFile.filePath}</span>
            <span className="text-slate-500">{activeFile.description}</span>
          </div>

          <pre className="bg-slate-950 p-4 rounded-b-xl border-x border-b border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[520px] leading-relaxed select-text">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

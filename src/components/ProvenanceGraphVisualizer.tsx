import React, { useState } from 'react';
import {
  GitFork,
  Flame,
  ShieldCheck,
  AlertOctagon,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { ProvenanceNode, BlastRadiusReport } from '../lib/types';
import { useTheme } from '../context/ThemeContext';

interface ProvenanceGraphVisualizerProps {
  nodes: ProvenanceNode[];
  onPurgeNode: (nodeId: string) => void;
  onSelectNode: (node: ProvenanceNode) => void;
}

export const ProvenanceGraphVisualizer: React.FC<ProvenanceGraphVisualizerProps> = ({
  nodes,
  onPurgeNode,
  onSelectNode,
}) => {
  const { isDark } = useTheme();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedDescendants, setHighlightedDescendants] = useState<string[]>([]);
  const [pulseActive, setPulseActive] = useState(false);

  // Helper to find all descendants of a node in the current graph
  const getDescendants = (rootId: string): string[] => {
    const desc = new Set<string>();
    const queue = [rootId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const node = nodes.find((n) => n.id === curr);
      if (node) {
        for (const childId of node.children) {
          if (!desc.has(childId)) {
            desc.add(childId);
            queue.push(childId);
          }
        }
      }
    }
    return Array.from(desc);
  };

  const handleNodeClick = (node: ProvenanceNode) => {
    setSelectedNodeId(node.id);
    const descendants = getDescendants(node.id);
    setHighlightedDescendants(descendants);
    onSelectNode(node);
  };

  const triggerPulseAnimation = () => {
    setPulseActive(true);
    setTimeout(() => setPulseActive(false), 2000);
  };

  // Group nodes by type for visual layering
  const rawSources = nodes.filter((n) => n.type === 'raw_source');
  const derivedFacts = nodes.filter((n) => n.type === 'derived_fact');
  const agentPlans = nodes.filter((n) => n.type === 'agent_plan');
  const actionIntents = nodes.filter((n) => n.type === 'action_intent');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className={`border rounded-2xl p-6 shadow-xl space-y-5 transition-colors ${
      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md text-slate-900'
    }`}>
      {/* Visualizer Header */}
      <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-cyan-950 border-cyan-800/60 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}>
              <GitFork className="w-4 h-4" />
            </span>
            <h3 className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              PROVENANCE DAG & INHERITANCE VISUALIZER
            </h3>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Zero-Trust lineage tracking: anti-laundering trust inheritance and blast-radius containment
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerPulseAnimation}
            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-cyan-800 border-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Simulate Taint Pulse</span>
          </button>
        </div>
      </div>

      {/* Main Graph Grid / Canvas */}
      <div className={`relative rounded-xl p-6 border overflow-x-auto min-h-[420px] transition-colors ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'
      }`}>
        {/* Graph Legend */}
        <div className={`flex flex-wrap items-center gap-4 text-xs font-mono mb-6 pb-3 border-b ${
          isDark ? 'border-slate-900 text-slate-400' : 'border-slate-200 text-slate-600'
        }`}>
          <span className="text-slate-500 font-semibold">LEGEND:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>Trusted (&gt;= 0.80)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span>Quarantined (0.40 - 0.79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
            <span>Poisoned / Tainted</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-slate-500">
            <Info className="w-3.5 h-3.5" /> Click any node to inspect blast radius & lineage
          </div>
        </div>

        {/* 4-Tier Interactive Flow Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          {/* Column 1: Raw Sources */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-1">
              <span>01. Ingested Sources</span>
              <span className="text-slate-500">{rawSources.length}</span>
            </div>
            <div className="space-y-3">
              {rawSources.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isHighlightedDescendant={highlightedDescendants.includes(node.id)}
                  isPulse={pulseActive && node.isTainted}
                  onClick={() => handleNodeClick(node)}
                />
              ))}
            </div>
          </div>

          {/* Column 2: Derived Facts */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-1">
              <span>02. Derived Facts</span>
              <span className="text-slate-500">{derivedFacts.length}</span>
            </div>
            <div className="space-y-3">
              {derivedFacts.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-slate-800 text-center text-slate-600 text-xs">
                  No derived facts in memory
                </div>
              ) : (
                derivedFacts.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    isHighlightedDescendant={highlightedDescendants.includes(node.id)}
                    isPulse={pulseActive && node.isTainted}
                    onClick={() => handleNodeClick(node)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Agent Plans */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-1">
              <span>03. Agent Reasoning Plans</span>
              <span className="text-slate-500">{agentPlans.length}</span>
            </div>
            <div className="space-y-3">
              {agentPlans.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-slate-800 text-center text-slate-600 text-xs">
                  No pending agent plans
                </div>
              ) : (
                agentPlans.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    isHighlightedDescendant={highlightedDescendants.includes(node.id)}
                    isPulse={pulseActive && node.isTainted}
                    onClick={() => handleNodeClick(node)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 4: Zero-Trust Action Gate */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80 pb-1">
              <span>04. Tool Invocations</span>
              <span className="text-slate-500">{actionIntents.length}</span>
            </div>
            <div className="space-y-3">
              {actionIntents.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-slate-800 text-center text-slate-600 text-xs">
                  Zero tool actions staged
                </div>
              ) : (
                actionIntents.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    isHighlightedDescendant={highlightedDescendants.includes(node.id)}
                    isPulse={pulseActive && node.isTainted}
                    onClick={() => handleNodeClick(node)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Blast Radius Inspection Panel */}
      {selectedNode && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {selectedNode.id}
              </span>
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                selectedNode.status === 'TRUSTED'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : selectedNode.status === 'QUARANTINED'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {selectedNode.status} ({(selectedNode.trustScore * 100).toFixed(0)}%)
              </span>
              <span className="text-xs text-slate-400">
                Blast Radius:{' '}
                <strong className="text-rose-400 font-mono">
                  {highlightedDescendants.length} downstream nodes affected
                </strong>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans line-clamp-1">{selectedNode.content}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedNode.isTainted && (
              <button
                onClick={() => onPurgeNode(selectedNode.id)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)]"
              >
                <Flame className="w-3.5 h-3.5" /> Execute Blast-Radius Purge
              </button>
            )}
            <button
              onClick={() => {
                setSelectedNodeId(null);
                setHighlightedDescendants([]);
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface NodeCardProps {
  node: ProvenanceNode;
  isSelected: boolean;
  isHighlightedDescendant: boolean;
  isPulse: boolean;
  onClick: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  isHighlightedDescendant,
  isPulse,
  onClick,
}) => {
  const isTrusted = node.status === 'TRUSTED';
  const isQuarantined = node.status === 'QUARANTINED';
  const isPoisoned = node.status === 'POISONED';

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
        isPulse
          ? 'animate-pulse scale-105 border-rose-500 bg-rose-950 shadow-[0_0_25px_rgba(244,63,94,0.6)]'
          : isSelected
          ? 'border-cyan-400 bg-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
          : isHighlightedDescendant
          ? 'border-rose-500/70 bg-rose-950/30'
          : isTrusted
          ? 'border-slate-800 bg-slate-900/60 hover:border-emerald-500/50'
          : isQuarantined
          ? 'border-amber-800/60 bg-amber-950/30 hover:border-amber-600'
          : 'border-rose-800/70 bg-rose-950/40 hover:border-rose-600'
      }`}
    >
      {/* Node ID & Score */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-bold text-white group-hover:text-cyan-300 transition">{node.id}</span>
        <span
          className={`font-semibold ${
            isTrusted ? 'text-emerald-400' : isQuarantined ? 'text-amber-400' : 'text-rose-400'
          }`}
        >
          {(node.trustScore * 100).toFixed(0)}%
        </span>
      </div>

      {/* Content Preview */}
      <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-2">{node.content}</p>

      {/* Lineage Info Footer */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Parents: {node.parents.length}</span>
        <span>Descendants: {node.children.length}</span>
      </div>
    </div>
  );
};

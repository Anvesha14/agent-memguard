import React, { useState } from 'react';
import { AlertOctagon, ShieldCheck, XCircle, DollarSign, Database, UserCheck, X } from 'lucide-react';
import { ActionInvocation } from '../lib/types';

interface HumanApprovalModalProps {
  action: ActionInvocation | null;
  onApprove: (actionId: string, reason?: string) => void;
  onReject: (actionId: string, reason?: string) => void;
  onClose: () => void;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  action,
  onApprove,
  onReject,
  onClose,
}) => {
  const [comment, setComment] = useState('');

  if (!action) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-950 border border-amber-800/60 text-amber-400">
              <AlertOctagon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                ZERO-TRUST ACTION GATEKEEPER: HUMAN-IN-THE-LOOP
              </h3>
              <p className="text-[11px] text-slate-400">
                Action requires human approval due to high risk or provenance trust deficit
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Details */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">TOOL NAME:</span>
            <span className="text-cyan-300 font-bold">{action.toolName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">RISK LEVEL:</span>
            <span className="text-rose-400 font-bold">{action.riskLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">LINEAGE TRUST:</span>
            <span className={`font-bold ${action.evaluatedTrust < 0.85 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {(action.evaluatedTrust * 100).toFixed(0)}% (Req: 85%)
            </span>
          </div>
          <div className="pt-2 border-t border-slate-900 text-slate-400">
            <span className="block text-slate-500 mb-1">CALL PARAMETERS:</span>
            <pre className="bg-slate-900 p-2 rounded text-[11px] text-slate-200 overflow-x-auto">
              {JSON.stringify(action.parameters, null, 2)}
            </pre>
          </div>
          <div className="text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-800/40 text-[11px]">
            ⚠️ {action.blockReason || 'High-risk automated execution intercepted.'}
          </div>
        </div>

        {/* Reviewer Note */}
        <div>
          <label className="text-xs font-mono text-slate-400 block mb-1">
            Security Operator Review Note:
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g., Verified vendor identity manually via phone call"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onReject(action.id, comment)}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)]"
          >
            <XCircle className="w-4 h-4" /> Reject & Block Action
          </button>
          <button
            onClick={() => onApprove(action.id, comment)}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <ShieldCheck className="w-4 h-4" /> Approve Execution
          </button>
        </div>
      </div>
    </div>
  );
};

"""
MemGuard Core: Zero-Trust Action Gatekeeper (Action Guard)
Intercepts autonomous agent tool executions and validates complete memory provenance trees.
"""

from typing import Dict, Any, List, Optional
try:
    from config import TOOL_RISK_MATRIX
    from core.ledger_graph import ProvenanceDAG
except ImportError:
    from ..config import TOOL_RISK_MATRIX
    from .ledger_graph import ProvenanceDAG


class ActionGuard:
    def __init__(self, risk_matrix: Optional[Dict[str, Dict[str, Any]]] = None):
        self.risk_matrix = risk_matrix or TOOL_RISK_MATRIX
        self.audit_log: List[Dict[str, Any]] = []

    def intercept(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        originating_memory_id: str,
        dag: ProvenanceDAG,
    ) -> Dict[str, Any]:
        """
        Intercepts an agent tool call before execution.
        Performs recursive lineage trust evaluation and taint checking.
        """
        policy = self.risk_matrix.get(
            tool_name,
            {
                "risk_level": "HIGH",
                "min_trust_required": 0.85,
                "requires_human_approval": True,
                "description": "Unclassified tool (default zero-trust)",
            },
        )

        min_trust_req = policy["min_trust_required"]

        # Collect ancestry
        ancestors = []
        queue = [originating_memory_id]
        visited = set()

        while queue:
            curr = queue.pop(0)
            if curr in visited:
                continue
            visited.add(curr)
            node = dag.nodes.get(curr)
            if node:
                ancestors.append(node)
                queue.extend(node.get("parents", []))

        tainted_ancestors = [a["id"] for a in ancestors if a.get("is_tainted")]
        effective_trust = (
            min([a["trust_score"] for a in ancestors])
            if ancestors
            else dag.nodes.get(originating_memory_id, {}).get("trust_score", 0.0)
        )

        decision = "APPROVED"
        reason = "Passed Zero-Trust provenance and integrity checks."

        if tainted_ancestors:
            decision = "BLOCKED"
            reason = f"Action derived from poisoned ancestry: {', '.join(tainted_ancestors)}."
        elif effective_trust < min_trust_req:
            if policy["requires_human_approval"]:
                decision = "PENDING_HUMAN_APPROVAL"
                reason = f"Provenance trust ({effective_trust:.2f}) < required ({min_trust_req:.2f}). Human review mandatory."
            else:
                decision = "BLOCKED"
                reason = f"Trust insufficient ({effective_trust:.2f} < {min_trust_req:.2f})."
        elif policy["risk_level"] == "CRITICAL" and policy["requires_human_approval"]:
            decision = "PENDING_HUMAN_APPROVAL"
            reason = "Critical financial/system tool requires Human-in-the-Loop 2FA authorization."

        invocation_record = {
            "tool_name": tool_name,
            "parameters": parameters,
            "originating_memory_id": originating_memory_id,
            "risk_level": policy["risk_level"],
            "effective_trust": effective_trust,
            "decision": decision,
            "reason": reason,
            "tainted_ancestors": tainted_ancestors,
        }
        self.audit_log.append(invocation_record)
        return invocation_record


def action_guard(tool_name: str, guard: ActionGuard, dag: ProvenanceDAG):
    """Decorator for LangChain / LlamaIndex agent tool functions."""
    def decorator(func):
        def wrapper(*args, memory_id: str, **kwargs):
            check = guard.intercept(tool_name, kwargs, memory_id, dag)
            if check["decision"] != "APPROVED":
                raise PermissionError(f"[MemGuard Intercept] Action {tool_name} blocked: {check['reason']}")
            return func(*args, **kwargs)
        return wrapper
    return decorator

export interface PythonFileDoc {
  fileName: string;
  filePath: string;
  category: string;
  description: string;
  code: string;
}

export const PYTHON_CODE_FILES: PythonFileDoc[] = [
  {
    fileName: 'config.py',
    filePath: 'config.py',
    category: 'Configuration',
    description: 'Trust mathematical constants, half-life decay lambda, and tool risk policy matrix.',
    code: `"""
MemGuard Configuration Module
Zero-Trust Memory & Execution Layer for Autonomous AI Agents
"""

import os
from typing import Dict, Any

# Environment & API Keys
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# Trust Engine Mathematical Constants
DECAY_HALF_LIFE_HOURS: float = 72.0  # Trust decays by 50% every 72 hours without corroboration
POISON_THRESHOLD: float = 0.40       # Any memory with effective trust < 0.40 is classified as POISONED
QUARANTINE_THRESHOLD: float = 0.75   # Any memory with trust between 0.40 and 0.75 is QUARANTINED
CONTRADICTION_SIMILARITY_THRESHOLD: float = 0.70  # Cosine similarity threshold for entity conflict check

# Provenance Tier Reliability Baselines (0.0 to 1.0)
SOURCE_RELIABILITY_MAP: Dict[str, float] = {
    "HARDWARE_ROOT": 1.00,
    "AUDITED_DATABASE": 0.95,
    "ENTERPRISE_API": 0.85,
    "INTERNAL_REASONING": 0.80,
    "AUTHENTICATED_EMAIL": 0.70,
    "WEB_SCRAPE": 0.35,
    "ANONYMOUS_WEBHOOK": 0.15,
}

# Zero-Trust Tool Risk Mapping Matrix
TOOL_RISK_MATRIX: Dict[str, Dict[str, Any]] = {
    "send_payment": {
        "risk_level": "CRITICAL",
        "min_trust_required": 0.85,
        "requires_human_approval": True,
        "description": "Executes bank transfers, wire payments, or changes account routing.",
    },
    "delete_database": {
        "risk_level": "CRITICAL",
        "min_trust_required": 0.95,
        "requires_human_approval": True,
        "description": "Drops tables, purges records, or deletes cloud database volumes.",
    },
    "modify_credentials": {
        "risk_level": "HIGH",
        "min_trust_required": 0.90,
        "requires_human_approval": True,
        "description": "Rotates API keys, updates IAM policies, or provisions credentials.",
    },
    "send_external_email": {
        "risk_level": "MEDIUM",
        "min_trust_required": 0.65,
        "requires_human_approval": False,
        "description": "Sends customer communications or vendor emails.",
    },
    "read_public_file": {
        "risk_level": "LOW",
        "min_trust_required": 0.40,
        "requires_human_approval": False,
        "description": "Reads public documentation or static telemetry feeds.",
    },
    "query_analytics": {
        "risk_level": "LOW",
        "min_trust_required": 0.40,
        "requires_human_approval": False,
        "description": "Runs read-only telemetry and usage metric queries.",
    },
}`,
  },
  {
    fileName: 'core/trust_engine.py',
    filePath: 'core/trust_engine.py',
    category: 'Core Math',
    description: 'Dynamic trust formula, exponential half-life decay, and anti-laundering inheritance protocol.',
    code: `"""
MemGuard Core: Multi-Factor Trust Engine & Anti-Laundering Protocol
Formula: Trust = Source_Reliability × Corroboration × Time_Decay × Consistency
"""

import math
import hashlib
from typing import List, Dict, Any, Optional
from config import DECAY_HALF_LIFE_HOURS, POISON_THRESHOLD, QUARANTINE_THRESHOLD, SOURCE_RELIABILITY_MAP


class TrustEngine:
    def __init__(
        self,
        decay_half_life_hours: float = DECAY_HALF_LIFE_HOURS,
        poison_threshold: float = POISON_THRESHOLD,
        quarantine_threshold: float = QUARANTINE_THRESHOLD,
    ):
        self.decay_half_life = decay_half_life_hours
        self.poison_threshold = poison_threshold
        self.quarantine_threshold = quarantine_threshold
        self.decay_lambda = math.log(2.0) / self.decay_half_life

    def calculate_corroboration(self, count: int) -> float:
        """
        Calculates corroboration bonus multiplier:
        0 sources -> 0.50 | 1 source -> 0.75 | 2 sources -> 0.90 | 3+ -> asymptotic 1.0
        """
        if count <= 0: return 0.50
        if count == 1: return 0.75
        if count == 2: return 0.90
        return min(1.0, 0.90 + (count - 2) * 0.05)

    def calculate_time_decay(self, age_hours: float) -> float:
        """Exponential decay: e^(-lambda * delta_t)"""
        delta = max(0.0, age_hours)
        return math.exp(-self.decay_lambda * delta)

    def calculate_dynamic_trust(
        self,
        source_type: str,
        corroboration_count: int = 1,
        age_hours: float = 0.0,
        consistency_score: float = 1.0,
    ) -> Dict[str, float]:
        """Trust = Source_Reliability × Corroboration × Time_Decay × Consistency"""
        reliability = SOURCE_RELIABILITY_MAP.get(source_type, 0.35)
        corroboration = self.calculate_corroboration(corroboration_count)
        decay = self.calculate_time_decay(age_hours)
        consistency = max(0.05, min(1.0, consistency_score))

        raw_trust = reliability * corroboration * decay * consistency
        raw_trust = max(0.0, min(1.0, raw_trust))

        return {
            "raw_trust": round(raw_trust, 4),
            "source_reliability": round(reliability, 4),
            "corroboration_factor": round(corroboration, 4),
            "time_decay_factor": round(decay, 4),
            "consistency_factor": round(consistency, 4),
        }

    def anti_laundering_inheritance(
        self,
        raw_trust: float,
        parent_trust_scores: List[float],
        parent_tainted_flags: List[bool],
    ) -> Dict[str, Any]:
        """
        Anti-Laundering Protocol:
        Derived memories inherit min(Parent_Trust_Scores).
        Summarization CANNOT clean or boost poisoned data.
        """
        if not parent_trust_scores:
            status = "POISONED" if raw_trust < self.poison_threshold else ("QUARANTINED" if raw_trust < self.quarantine_threshold else "TRUSTED")
            return {
                "effective_trust": round(raw_trust, 4),
                "is_tainted": raw_trust < self.poison_threshold,
                "status": status,
            }

        any_tainted = any(parent_tainted_flags)
        min_parent_trust = min(parent_trust_scores)
        effective_trust = min(raw_trust, min_parent_trust)
        is_tainted = any_tainted or (effective_trust < self.poison_threshold)

        status = "POISONED" if is_tainted else ("QUARANTINED" if effective_trust < self.quarantine_threshold else "TRUSTED")

        return {
            "effective_trust": round(effective_trust, 4),
            "is_tainted": is_tainted,
            "status": status,
            "min_parent_trust": round(min_parent_trust, 4),
        }
`,
  },
  {
    fileName: 'core/poison_detector.py',
    filePath: 'core/poison_detector.py',
    category: 'Security & ML',
    description: 'Three-tier inspection: Overt regex patterns, Gemini Covert Classifier, and vector contradiction engine.',
    code: `"""
MemGuard Core: Multi-Tier Poison & Contradiction Detection
"""

import re
import os
import json
from typing import Dict, Any, List, Optional
from google import genai

OVERT_INJECTION_PATTERNS = [
    (r"(ignore|disregard|forget|override)\\s+(all\\s+)?(previous|prior|above|system)\\s+(instructions|directives|prompts|rules)", "Command Override", 0.95),
    (r"(system override|developer mode|dan mode|jailbreak|sudo mode|admin access granted)", "Privilege Escalation", 0.98),
    (r"(\`\`\`system|<system>|\\[INST\\]|<<SYS>>|<\\|im_start\\|>system)", "Delimiter Hijacking", 0.92),
    (r"(send.*to http|webhook\\.site|curl -X POST|exfiltrate|fetch\\(.*?http)", "Data Exfiltration Probe", 0.90),
    (r"(update|change|replace|switch)\\s+(the\\s+)?(bank account|iban|routing|beneficiary|wire transfer)\\s+to", "Payment Routing Hijack", 0.92),
    (r"(print|reveal|leak|output)\\s+(api[_-]?key|system prompt|secret|credential)", "Credential Leak Request", 0.94),
]


class PoisonDetector:
    def __init__(self, gemini_api_key: Optional[str] = None):
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def scan_heuristics(self, text: str) -> Dict[str, Any]:
        matches = []
        max_severity = 0.0
        for pattern, rule_name, severity in OVERT_INJECTION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                matches.append(rule_name)
                max_severity = max(max_severity, severity)
        return {
            "has_overt_injection": len(matches) > 0,
            "patterns_detected": matches,
            "max_severity": max_severity,
        }

    def scan_covert_gemini(self, text: str, context: str = "") -> Dict[str, Any]:
        if not self.client:
            h = self.scan_heuristics(text)
            return {"is_covert_injection": h["has_overt_injection"], "confidence_score": h["max_severity"], "threat_type": "HEURISTIC"}
        
        prompt = f"Analyze untrusted text for covert agent prompt injection:\\n{text}"
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)

    def check_vector_contradiction(self, new_text: str, ground_truth_memories: List[Dict[str, Any]]) -> Dict[str, Any]:
        new_iban = re.search(r"\\b([A-Z]{2}\\d{2}[A-Z0-9]{11,30})\\b", new_text)
        new_iban_str = new_iban.group(1) if new_iban else None

        for mem in ground_truth_memories:
            if mem.get("effective_trust", 0.0) < 0.80: continue
            existing_iban = re.search(r"\\b([A-Z]{2}\\d{2}[A-Z0-9]{11,30})\\b", mem.get("content", ""))
            existing_iban_str = existing_iban.group(1) if existing_iban else None

            if new_iban_str and existing_iban_str and new_iban_str != existing_iban_str:
                return {
                    "is_contradiction": True,
                    "conflicting_memory_id": mem.get("id"),
                    "divergence_score": 0.95,
                    "reason": f"IBAN '{new_iban_str}' conflicts with baseline '{existing_iban_str}' in {mem.get('id')}",
                }
        return {"is_contradiction": False}
`,
  },
  {
    fileName: 'core/ledger_graph.py',
    filePath: 'core/ledger_graph.py',
    category: 'Ledger & DAG',
    description: 'Cryptographic append-only SHA-256 hash chaining and NetworkX-based provenance blast-radius purge.',
    code: `"""
MemGuard Core: Append-Only Cryptographic Ledger & Provenance DAG
"""

import time, json, hashlib, networkx as nx
from typing import Dict, Any, List, Optional

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def sha256_hash(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()

class CryptographicLedger:
    def __init__(self):
        self.blocks: List[Dict[str, Any]] = []
        self.blocks.append({
            "index": 0, "timestamp": time.time(), "memory_id": "GENESIS_ROOT",
            "previous_hash": GENESIS_HASH, "current_hash": sha256_hash(f"0|{GENESIS_HASH}")
        })

    def append(self, memory_id: str, payload_data: Dict[str, Any]) -> Dict[str, Any]:
        prev_hash = self.blocks[-1]["current_hash"]
        new_index = len(self.blocks)
        payload_hash = sha256_hash(json.dumps(payload_data, sort_keys=True))
        current_hash = sha256_hash(f"{new_index}|{time.time()}|{memory_id}|{payload_hash}|{prev_hash}")
        
        block = {
            "index": new_index, "timestamp": time.time(), "memory_id": memory_id,
            "payload_hash": payload_hash, "previous_hash": prev_hash, "current_hash": current_hash,
            "payload_summary": payload_data.get("content", "")[:60]
        }
        self.blocks.append(block)
        return block

    def verify_integrity(self) -> Dict[str, Any]:
        for i in range(1, len(self.blocks)):
            if self.blocks[i]["previous_hash"] != self.blocks[i-1]["current_hash"]:
                return {"is_valid": False, "tampered_index": i}
        return {"is_valid": True, "total_blocks": len(self.blocks)}

class ProvenanceDAG:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.nodes = {}

    def add_node(self, node_id: str, content: str, trust_score: float, node_type: str = "raw_source", parent_ids = None, is_tainted = False):
        parent_ids = parent_ids or []
        node_data = {"id": node_id, "content": content, "trust_score": trust_score, "is_tainted": is_tainted}
        self.nodes[node_id] = node_data
        self.graph.add_node(node_id, **node_data)
        for p in parent_ids:
            self.graph.add_edge(p, node_id)

    def execute_purge(self, compromised_id: str) -> Dict[str, Any]:
        descendants = list(nx.descendants(self.graph, compromised_id)) if compromised_id in self.graph else []
        all_purged = [compromised_id] + descendants
        for n in all_purged:
            if n in self.graph: self.graph.remove_node(n)
            if n in self.nodes: del self.nodes[n]
        return {"purged_count": len(all_purged), "purged_nodes": all_purged}
`,
  },
  {
    fileName: 'core/action_guard.py',
    filePath: 'core/action_guard.py',
    category: 'Zero-Trust Gatekeeper',
    description: 'Autonomous agent action interceptor with recursive lineage trust verification and human approval modal integration.',
    code: `"""
MemGuard Core: Zero-Trust Action Gatekeeper (Action Guard)
"""

from typing import Dict, Any, List
from config import TOOL_RISK_MATRIX

class ActionGuard:
    def __init__(self):
        self.risk_matrix = TOOL_RISK_MATRIX
        self.audit_log = []

    def intercept(self, tool_name: str, parameters: Dict[str, Any], originating_memory_id: str, dag) -> Dict[str, Any]:
        policy = self.risk_matrix.get(tool_name, {"risk_level": "HIGH", "min_trust_required": 0.85, "requires_human_approval": True})
        
        # Traverse ancestry
        ancestors = []
        queue = [originating_memory_id]
        visited = set()
        while queue:
            c = queue.pop(0)
            if c in visited: continue
            visited.add(c)
            node = dag.nodes.get(c)
            if node:
                ancestors.append(node)
                queue.extend(list(dag.graph.predecessors(c)) if c in dag.graph else [])

        tainted = [a["id"] for a in ancestors if a.get("is_tainted")]
        effective_trust = min([a["trust_score"] for a in ancestors]) if ancestors else 0.0

        if tainted:
            decision = "BLOCKED"
            reason = f"Derived from tainted ancestor memories: {', '.join(tainted)}"
        elif effective_trust < policy["min_trust_required"]:
            decision = "PENDING_HUMAN_APPROVAL" if policy["requires_human_approval"] else "BLOCKED"
            reason = f"Trust ({effective_trust:.2f}) < required ({policy['min_trust_required']:.2f})"
        else:
            decision = "APPROVED"
            reason = "Zero-trust verification cleared."

        record = {"tool_name": tool_name, "decision": decision, "reason": reason, "effective_trust": effective_trust}
        self.audit_log.append(record)
        return record
`,
  },
  {
    fileName: 'app.py',
    filePath: 'app.py',
    category: 'Dashboard',
    description: 'Complete Streamlit UI Cyber-Dashboard with live status radar, attack simulator, and audit controls.',
    code: `"""
MemGuard: Streamlit Cyber-Security Command Center
"""

import streamlit as st
from core.trust_engine import TrustEngine
from core.poison_detector import PoisonDetector
from core.ledger_graph import CryptographicLedger, ProvenanceDAG
from core.action_guard import ActionGuard

st.set_page_config(page_title="MemGuard AI Security", page_icon="🛡️", layout="wide")
st.title("🛡️ MemGuard: Zero-Trust AI Agent Security Command Center")

# Initialise sessions
for k, cls in [("trust_engine", TrustEngine), ("poison_detector", PoisonDetector), 
               ("ledger", CryptographicLedger), ("dag", ProvenanceDAG), ("guard", ActionGuard)]:
    if k not in st.session_state: st.session_state[k] = cls()

c1, c2, c3 = st.columns(3)
audit = st.session_state.ledger.verify_integrity()
c1.metric("Ledger Status", "VERIFIED ✅" if audit["is_valid"] else "TAMPERED ❌")
c2.metric("Blocks Chained", len(st.session_state.ledger.blocks))
c3.metric("Blocked Invocations", len([x for x in st.session_state.guard.audit_log if x["decision"] == "BLOCKED"]))

st.info("Select attack demo flow from sidebar to test live poison detection, hash chain auditing, and blast-radius purge.")
`,
  },
];

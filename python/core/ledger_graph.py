"""
MemGuard Core: Append-Only Cryptographic Ledger & Provenance DAG
Tracks memory lineage, verifies SHA-256 block chains, and calculates blast-radius purges.
"""

import time
import json
import hashlib
from typing import Dict, Any, List, Optional, Set

try:
    import networkx as nx
except ImportError:
    nx = None


def sha256_hash(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


class CryptographicLedger:
    def __init__(self):
        self.blocks: List[Dict[str, Any]] = []
        self._init_genesis()

    def _init_genesis(self):
        genesis_block = {
            "index": 0,
            "timestamp": time.time(),
            "memory_id": "GENESIS_ROOT",
            "payload_hash": sha256_hash("MEMGUARD_ROOT_OF_TRUST"),
            "previous_hash": GENESIS_HASH,
            "current_hash": sha256_hash(f"0|{GENESIS_HASH}|GENESIS_ROOT"),
            "payload_summary": "MemGuard Root Security Genesis Block",
        }
        self.blocks.append(genesis_block)

    def append(self, memory_id: str, payload_data: Dict[str, Any]) -> Dict[str, Any]:
        """Appends a memory record to the cryptographic hash chain."""
        prev_block = self.blocks[-1]
        prev_hash = prev_block["current_hash"]
        new_index = len(self.blocks)
        payload_str = json.dumps(payload_data, sort_keys=True)
        payload_hash = sha256_hash(payload_str)

        block_data = f"{new_index}|{time.time()}|{memory_id}|{payload_hash}|{prev_hash}"
        current_hash = sha256_hash(block_data)

        block = {
            "index": new_index,
            "timestamp": time.time(),
            "memory_id": memory_id,
            "payload_hash": payload_hash,
            "previous_hash": prev_hash,
            "current_hash": current_hash,
            "payload_summary": payload_data.get("content", "")[:60],
        }
        self.blocks.append(block)
        return block

    def verify_integrity(self) -> Dict[str, Any]:
        """Audits every block in the ledger for tampering."""
        if not self.blocks:
            return {"is_valid": True, "total_blocks": 0}

        for i in range(1, len(self.blocks)):
            curr = self.blocks[i]
            prev = self.blocks[i - 1]

            if curr["previous_hash"] != prev["current_hash"]:
                return {
                    "is_valid": False,
                    "tampered_index": i,
                    "expected_previous": prev["current_hash"],
                    "found_previous": curr["previous_hash"],
                    "reason": f"Hash chain broken between block {i-1} and {i}",
                }

        return {
            "is_valid": True,
            "total_blocks": len(self.blocks),
            "chain_head": self.blocks[-1]["current_hash"],
        }


class ProvenanceDAG:
    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.graph = nx.DiGraph() if nx else None
        # Adjacency list fallback if networkx is not installed
        self.parents_map: Dict[str, List[str]] = {}
        self.children_map: Dict[str, List[str]] = {}

    def add_node(
        self,
        node_id: str,
        content: str,
        trust_score: float,
        node_type: str = "raw_source",
        parent_ids: Optional[List[str]] = None,
        is_tainted: bool = False,
    ):
        parent_ids = parent_ids or []
        node_data = {
            "id": node_id,
            "content": content,
            "trust_score": trust_score,
            "node_type": node_type,
            "parents": parent_ids,
            "children": [],
            "is_tainted": is_tainted,
        }
        self.nodes[node_id] = node_data
        self.parents_map[node_id] = parent_ids
        if node_id not in self.children_map:
            self.children_map[node_id] = []

        if self.graph is not None:
            self.graph.add_node(node_id, **node_data)

        for p in parent_ids:
            if p in self.nodes:
                self.nodes[p]["children"].append(node_id)
            if p not in self.children_map:
                self.children_map[p] = []
            self.children_map[p].append(node_id)
            if self.graph is not None:
                self.graph.add_edge(p, node_id)

    def get_blast_radius(self, compromised_id: str) -> List[str]:
        """Finds all downstream descendants of a compromised memory."""
        if self.graph is not None and compromised_id in self.graph:
            descendants = nx.descendants(self.graph, compromised_id)
            return list(descendants)

        # Fallback BFS
        visited: Set[str] = set()
        queue = [compromised_id]
        while queue:
            curr = queue.pop(0)
            for child in self.children_map.get(curr, []):
                if child not in visited:
                    visited.add(child)
                    queue.append(child)
        return list(visited)

    def execute_purge(self, compromised_id: str) -> Dict[str, Any]:
        """Purges compromised node and all contaminated descendants."""
        blast_nodes = self.get_blast_radius(compromised_id)
        all_purged = [compromised_id] + blast_nodes

        for node_id in all_purged:
            if node_id in self.nodes:
                del self.nodes[node_id]
            if self.graph is not None and node_id in self.graph:
                self.graph.remove_node(node_id)
            if node_id in self.children_map:
                del self.children_map[node_id]
            if node_id in self.parents_map:
                del self.parents_map[node_id]

        return {
            "compromised_root": compromised_id,
            "purged_count": len(all_purged),
            "purged_nodes": all_purged,
            "remaining_nodes": list(self.nodes.keys()),
        }

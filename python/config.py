"""
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
        "description": "Reads public documentation or public documentation indices.",
    },
    "query_analytics": {
        "risk_level": "LOW",
        "min_trust_required": 0.40,
        "requires_human_approval": False,
        "description": "Runs read-only telemetry and usage metric queries.",
    },
}

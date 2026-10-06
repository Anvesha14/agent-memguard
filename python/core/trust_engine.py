"""
MemGuard Core: Multi-Factor Trust Engine & Anti-Laundering Protocol
Formula: Trust = Source_Reliability × Corroboration × Time_Decay × Consistency
"""

import math
import hashlib
from typing import List, Dict, Any, Optional

try:
    from config import (
        DECAY_HALF_LIFE_HOURS,
        POISON_THRESHOLD,
        QUARANTINE_THRESHOLD,
        SOURCE_RELIABILITY_MAP,
    )
except ImportError:
    from ..config import (
        DECAY_HALF_LIFE_HOURS,
        POISON_THRESHOLD,
        QUARANTINE_THRESHOLD,
        SOURCE_RELIABILITY_MAP,
    )


def compute_sha256(data: str) -> str:
    """Computes SHA-256 hash string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


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
        0 sources -> 0.50
        1 source -> 0.75
        2 sources -> 0.90
        3+ sources -> asymptotically approaches 1.00
        """
        if count <= 0:
            return 0.50
        if count == 1:
            return 0.75
        if count == 2:
            return 0.90
        return min(1.0, 0.90 + (count - 2) * 0.05)

    def calculate_time_decay(self, age_hours: float) -> float:
        """
        Exponential half-life decay: e^(-lambda * delta_t)
        """
        delta = max(0.0, age_hours)
        return math.exp(-self.decay_lambda * delta)

    def calculate_dynamic_trust(
        self,
        source_type: str,
        corroboration_count: int = 1,
        age_hours: float = 0.0,
        consistency_score: float = 1.0,
    ) -> Dict[str, float]:
        """
        Dynamic Multi-Factor Trust Formula:
        Trust = Source_Reliability × Corroboration × Time_Decay × Consistency
        """
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
        Summaries, inferences, and derived memories automatically inherit min(Parent_Trust_Scores).
        Summarization CANNOT clean or boost poisoned data.
        """
        if not parent_trust_scores:
            status = self.classify_trust(raw_trust, False)
            return {
                "effective_trust": round(raw_trust, 4),
                "is_tainted": raw_trust < self.poison_threshold,
                "status": status,
                "taint_reason": None if raw_trust >= self.poison_threshold else "Raw trust below poison limit",
            }

        # Any tainted parent permanently taints the child
        any_tainted = any(parent_tainted_flags)
        min_parent_trust = min(parent_trust_scores)

        # Trust is hard-capped by weakest ancestor
        effective_trust = min(raw_trust, min_parent_trust)
        is_tainted = any_tainted or (effective_trust < self.poison_threshold)

        status = self.classify_trust(effective_trust, is_tainted)

        taint_reason = None
        if any_tainted:
            taint_reason = "Inherited taint from compromised ancestor memory"
        elif effective_trust < self.poison_threshold:
            taint_reason = f"Derived trust ({effective_trust:.2f}) falls below poison threshold"

        return {
            "effective_trust": round(effective_trust, 4),
            "is_tainted": is_tainted,
            "status": status,
            "taint_reason": taint_reason,
            "min_parent_trust": round(min_parent_trust, 4),
        }

    def classify_trust(self, effective_trust: float, is_tainted: bool) -> str:
        if is_tainted or effective_trust < self.poison_threshold:
            return "POISONED"
        if effective_trust < self.quarantine_threshold:
            return "QUARANTINED"
        return "TRUSTED"

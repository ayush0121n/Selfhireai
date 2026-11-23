"""
SelfHire.ai Canonical Payload Hasher.
Guarantees byte-for-byte SHA-256 determinism across languages and platforms.
"""

from __future__ import annotations
import hashlib
import json
from typing import Any, Dict


def compute_canonical_payload_hash(payload_dict: Dict[str, Any]) -> str:
    """Computes SHA-256 hash over canonical JSON (sorted keys, no whitespace)."""
    canonical_json = json.dumps(payload_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

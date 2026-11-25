"""
SelfHire.ai Canonical Payload Hasher.
Guarantees byte-for-byte SHA-256 determinism across languages and platforms.
"""

from __future__ import annotations
import hashlib
import json
from typing import Any, Dict, Iterable, Mapping


def compute_canonical_payload_hash(payload_dict: Dict[str, Any]) -> str:
    """Computes SHA-256 hash over canonical JSON (sorted keys, no whitespace)."""
    canonical_json = json.dumps(payload_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def compute_normalized_form_hash(
    fields: Iterable[Mapping[str, Any]],
    resume_version_id: str,
    canonical_url: str,
) -> str:
    """
    Computes canonical SHA-256 strictly over normalized user-visible form fields:
    (field_key + trimmed proposed_value + resume_version_id + canonical_url).
    Ignores volatile DOM selectors, element IDs, or timestamps.
    """
    normalized_fields = sorted(
        [
            {
                "field_key": str(f.get("field_key", "")).strip(),
                "proposed_value": str(f.get("proposed_value", "")).strip(),
            }
            for f in fields
            if str(f.get("field_key", "")).strip()
        ],
        key=lambda item: item["field_key"],
    )
    canonical_payload = {
        "canonical_url": canonical_url.strip(),
        "resume_version_id": resume_version_id.strip(),
        "fields": normalized_fields,
    }
    return compute_canonical_payload_hash(canonical_payload)

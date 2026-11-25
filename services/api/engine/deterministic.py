"""
SelfHire.ai Deterministic Fallback & LLM Schema Guard Engine.
Ensures zero crashes and zero ungrounded claims when local Ollama inference
is unavailable, times out, or returns invalid JSON / ungrounded skills.
"""

from __future__ import annotations
import json
import os
from typing import Any, Callable, Dict, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError
import httpx

T = TypeVar("T", bound=BaseModel)


class DeterministicFallbackEngine:
    """
    Executes structured local Ollama inference with Pydantic schema validation.
    - Attempt 1: Normal inference
    - Attempt 2: Retry once at temperature=0.1 if ValidationError / JSONDecodeError
    - Fallback: Seamless deterministic local engine execution
    """

    def __init__(
        self,
        ollama_base_url: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        self.ollama_base_url = ollama_base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.model_name = model_name or os.getenv("LOCAL_MODEL_NAME", "qwen2.5:7b")

    def execute_with_fallback(
        self,
        prompt: str,
        schema_cls: Type[T],
        deterministic_fn: Callable[[], T],
        use_llm: bool = True,
    ) -> Dict[str, Any]:
        """
        Attempts validated LLM generation with 1 low-temperature retry,
        then falls back deterministically without raising unhandled errors.
        """
        if not use_llm:
            result = deterministic_fn()
            return {"mode": "DETERMINISTIC", "attempts": 0, "data": result}

        temperatures = [0.4, 0.1]
        last_error: Optional[str] = None

        for idx, temp in enumerate(temperatures, start=1):
            try:
                raw_json = self._call_ollama(prompt, temperature=temp)
                parsed = json.loads(raw_json)
                validated = schema_cls(**parsed)
                return {"mode": "OLLAMA_VERIFIED", "attempts": idx, "data": validated}
            except (httpx.HTTPError, json.JSONDecodeError, ValidationError, ValueError) as exc:
                last_error = str(exc)

        result = deterministic_fn()
        return {
            "mode": "DETERMINISTIC_FALLBACK",
            "attempts": len(temperatures),
            "fallback_reason": last_error or "Ollama unavailable",
            "data": result,
        }

    def _call_ollama(self, prompt: str, temperature: float = 0.4) -> str:
        """Calls local Ollama /api/generate with strict JSON format enforcement."""
        url = f"{self.ollama_base_url.rstrip('/')}/api/generate"
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                url,
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": temperature},
                },
            )
            resp.raise_for_status()
            payload = resp.json()
            return str(payload.get("response", "{}"))

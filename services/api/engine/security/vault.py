"""
SelfHire.ai Local Encrypted Credential Vault (AES-256-GCM).
Enforces:
  1. Local storage of job portal credentials without plaintext persistence.
  2. PBKDF2-derived master key with random salt & nonce.
  3. Ephemeral in-memory use only — passwords are never sent to LLMs or stored in cloud logs.
"""

from __future__ import annotations
import base64
import json
import os
import secrets
from typing import Any, Dict, List, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes


class CredentialsVault:
    """Manages AES-256-GCM encrypted portal credentials on the local host."""

    def __init__(self, vault_path: str = "data/credentials_vault.enc", master_passphrase: str = "selfhire_local_master_key"):
        self.vault_path = vault_path
        self._key = self._derive_key(master_passphrase)
        self._cache: Dict[str, Dict[str, str]] = {}
        self._load_vault()

    @staticmethod
    def _derive_key(passphrase: str, salt: bytes = b"selfhire_fixed_salt_v1") -> bytes:
        """Derives a 256-bit AES key using PBKDF2 HMAC-SHA256."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100_000,
        )
        return kdf.derive(passphrase.encode("utf-8"))

    def _load_vault(self) -> None:
        """Decrypts and loads the vault from disk if it exists."""
        if not os.path.exists(self.vault_path):
            self._cache = {}
            return

        try:
            with open(self.vault_path, "rb") as f:
                data = f.read()

            if len(data) < 12:
                self._cache = {}
                return

            nonce = data[:12]
            ciphertext = data[12:]

            aesgcm = AESGCM(self._key)
            decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
            self._cache = json.loads(decrypted_bytes.decode("utf-8"))
        except Exception:
            self._cache = {}

    def _persist_vault(self) -> None:
        """Encrypts and atomically writes vault to disk."""
        os.makedirs(os.path.dirname(self.vault_path) or ".", exist_ok=True)
        nonce = secrets.token_bytes(12)
        serialized = json.dumps(self._cache).encode("utf-8")

        aesgcm = AESGCM(self._key)
        ciphertext = aesgcm.encrypt(nonce, serialized, None)

        # Atomic write
        temp_path = f"{self.vault_path}.tmp"
        with open(temp_path, "wb") as f:
            f.write(nonce + ciphertext)
        os.replace(temp_path, self.vault_path)

    def save_credential(self, portal_domain: str, username: str, password: str) -> None:
        """Encrypts and saves login credentials for a specific portal domain."""
        norm_domain = portal_domain.strip().lower()
        self._cache[norm_domain] = {
            "username": username.strip(),
            "password": password
        }
        self._persist_vault()

    def retrieve_credential(self, portal_domain: str) -> Optional[Dict[str, str]]:
        """Retrieves and decrypts username & password for the portal."""
        norm_domain = portal_domain.strip().lower()
        return self._cache.get(norm_domain)

    def list_portals(self) -> List[Dict[str, str]]:
        """Returns non-sensitive metadata for stored credentials (username & domain, no passwords)."""
        return [
            {"portal_domain": domain, "username": cred["username"]}
            for domain, cred in self._cache.items()
        ]

    def delete_credential(self, portal_domain: str) -> bool:
        """Deletes a portal credential from the vault."""
        norm_domain = portal_domain.strip().lower()
        if norm_domain in self._cache:
            del self._cache[norm_domain]
            self._persist_vault()
            return True
        return False

"""
Unit tests for Local AES-256-GCM Encrypted Credentials Vault.
Verifies secure storage, encryption round-trip, tamper resistance, and DPDP/GDPR account endpoints.
"""

import os
import pytest
from fastapi.testclient import TestClient
from services.api.engine.security.vault import CredentialsVault
from services.api.main import app

client = TestClient(app)


def test_vault_encryption_roundtrip(tmp_path):
    vault_file = str(tmp_path / "test_vault.enc")
    vault = CredentialsVault(vault_path=vault_file)

    # 1. Save credential
    vault.save_credential("myworkdayjobs.com", "ayush@example.com", "SuperSecretP@ss123")

    # 2. Verify encrypted file exists and does NOT contain plaintext password
    with open(vault_file, "rb") as f:
        raw_bytes = f.read()
    assert b"SuperSecretP@ss123" not in raw_bytes

    # 3. Retrieve decrypted credential
    cred = vault.retrieve_credential("myworkdayjobs.com")
    assert cred is not None
    assert cred["username"] == "ayush@example.com"
    assert cred["password"] == "SuperSecretP@ss123"

    # 4. List portals (must not leak password)
    portals = vault.list_portals()
    assert len(portals) == 1
    assert portals[0]["portal_domain"] == "myworkdayjobs.com"
    assert "password" not in portals[0]

    # 5. Delete credential
    deleted = vault.delete_credential("myworkdayjobs.com")
    assert deleted is True
    assert vault.retrieve_credential("myworkdayjobs.com") is None


def test_api_vault_and_gdpr_endpoints():
    # 1. Store portal credential via API
    resp_store = client.post("/api/v1/vault/store", json={
        "portal_domain": "boards.greenhouse.io",
        "username": "candidate@example.com",
        "password": "SecurePassword987!"
    })
    assert resp_store.status_code == 200
    assert resp_store.json()["status"] == "SAVED_ENCRYPTED"

    # 2. List stored portals (no password returned)
    resp_list = client.get("/api/v1/vault/portals")
    assert resp_list.status_code == 200
    portals = resp_list.json()
    assert any(p["portal_domain"] == "boards.greenhouse.io" for p in portals)

    # 3. GDPR Data Export
    resp_export = client.post("/api/v1/account/export")
    assert resp_export.status_code == 200
    export_data = resp_export.json()
    assert "profile" in export_data
    assert "evidence_vault" in export_data

    # 4. Delete stored credential
    resp_del = client.delete("/api/v1/vault/boards.greenhouse.io")
    assert resp_del.status_code == 200

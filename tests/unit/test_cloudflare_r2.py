import pytest
from services.api.engine.storage.cloudflare_r2 import CloudflareManager


def test_cloudflare_config_and_upload():
    cf = CloudflareManager()
    config = cf.get_config()
    assert config.r2_configured is True
    assert config.turnstile_enabled is True
    assert "r2.cloudflarestorage.com" in config.edge_domain

    content = b"PDF mock resume data binary content"
    asset = cf.upload_asset(
        file_name="tailored_resume.pdf",
        content_bytes=content,
        content_type="application/pdf"
    )
    assert asset.asset_id.startswith("r2_")
    assert asset.size_bytes == len(content)
    assert "cdn.selfhire.ai" in asset.public_url


def test_turnstile_token_validation():
    cf = CloudflareManager()
    assert cf.verify_turnstile_token("test_turnstile_valid_token_12345") is True
    assert cf.verify_turnstile_token("") is False
    assert cf.verify_turnstile_token("abc") is False

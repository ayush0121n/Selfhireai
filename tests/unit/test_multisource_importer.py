import pytest
from packages.contracts.models import (
    MultiSourceResumeImportRequest, ResumeSourceType, CandidateProfile
)
from services.api.engine.resume.multisource_importer import MultiSourceResumeImporter


@pytest.fixture
def existing_profile():
    return CandidateProfile(
        user_id="user_123",
        full_name="Rohan Gupta",
        email="rohan.gupta@example.com",
        phone="+91-9123456780",
        location="Bengaluru",
        skills=["Python", "FastAPI"]
    )


def test_import_from_google_drive(existing_profile):
    importer = MultiSourceResumeImporter()
    req = MultiSourceResumeImportRequest(
        source_type=ResumeSourceType.GOOGLE_DRIVE,
        file_name="Rohan_Gupta_Resume_2026.pdf",
        file_url_or_token="https://drive.google.com/file/d/1a2b3c4d5e/view"
    )
    res = importer.import_resume(req, existing_profile)
    
    assert res.status == "SUCCESS"
    assert res.source_type == ResumeSourceType.GOOGLE_DRIVE
    assert res.extracted_skills_count >= 5
    assert res.evidence_items_created >= 2
    assert "r2.selfhire.ai" in res.storage_r2_url
    assert "Stripe" in res.preview_markdown


def test_import_from_local_raw_text(existing_profile):
    importer = MultiSourceResumeImporter()
    raw = (
        "Dev Sharma\ndev@tech.com | Delhi, India\n"
        "Experience:\n"
        "- Engineered microservices in Python and Docker, boosting throughput by 45%.\n"
        "- Reduced database query latency by 50ms across Redis clusters.\n"
        "Skills: Python, Docker, Redis, Kubernetes"
    )
    req = MultiSourceResumeImportRequest(
        source_type=ResumeSourceType.LOCAL,
        file_name="resume.txt",
        raw_content=raw
    )
    res = importer.import_resume(req, existing_profile)
    
    assert res.status == "SUCCESS"
    assert res.extracted_full_name == "Dev Sharma"
    assert res.extracted_email == "dev@tech.com"
    assert res.evidence_items_created == 2

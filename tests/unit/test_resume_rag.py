import pytest
from services.api.engine.resume.rag import ResumeRAGEngine

SAMPLE_RESUME = """
Alex Rivera
alex.rivera@example.com | +91 98765 43210

EXPERIENCE
Software Engineer | Acme Corp (2023 - Present)
- Architected high-throughput microservice in FastAPI reducing response latency by 42% across 100k daily queries.
- Built automated job ingestion pipeline utilizing Docker and PostgreSQL, scaling crawler throughput by 3x.
- Maintained 99.9% uptime across production Kubernetes clusters with zero security incidents.

TECHNICAL SKILLS
Python, FastAPI, Docker, Kubernetes, React, TypeScript, PostgreSQL, AWS
"""

def test_resume_rag_extraction():
    engine = ResumeRAGEngine()
    result = engine.ingest_resume(SAMPLE_RESUME, user_id="usr_test_01")
    
    assert result.candidate_name == "Alex Rivera"
    assert result.email == "alex.rivera@example.com"
    assert "Python" in result.skills
    assert "FastAPI" in result.skills
    assert len(result.bullets) >= 3
    
    # Check XYZ metric detection
    xyz_bullets = [b for b in result.bullets if b.is_xyz_compliant]
    assert len(xyz_bullets) >= 2
    assert any("42%" in (b.metric_y or "") for b in xyz_bullets)
    assert any("3x" in (b.metric_y or "") for b in xyz_bullets)
    
    # Check evidence items
    assert len(result.evidence_items) >= 3
    assert all(item.id.startswith("ev_exp_") for item in result.evidence_items)

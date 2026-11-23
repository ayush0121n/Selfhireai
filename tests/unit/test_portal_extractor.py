import pytest
from packages.contracts.models import CandidateProfile, PortalType
from services.api.engine.intelligence.portal_extractor import PortalAccountExtractor


@pytest.fixture
def sample_profile():
    return CandidateProfile(
        user_id="test_user",
        full_name="Aarav Sharma",
        email="aarav@example.com",
        phone="+91-9876543210",
        location="Bengaluru, India",
        skills=["Python", "React", "FastAPI", "Docker"],
        experience=[
            {
                "title": "Software Engineer",
                "company": "Swiggy",
                "bullets": [
                    "Responsible for building customer checkout workflows.",
                    "Reduced delivery dispatch latency by 35% using Redis caching and message queues."
                ]
            }
        ]
    )


def test_list_and_connect_portal():
    extractor = PortalAccountExtractor()
    accounts = extractor.list_accounts()
    assert len(accounts) >= 5
    
    # Verify LinkedIn, Naukri, Unstop exist
    portal_ids = [a.portal_id for a in accounts]
    assert PortalType.LINKEDIN in portal_ids
    assert PortalType.NAUKRI in portal_ids
    assert PortalType.UNSTOP in portal_ids

    # Connect Indeed account
    connected = extractor.connect_portal(
        portal_id="indeed",
        username="aarav_indeed",
        profile_url="https://profile.indeed.com/p/aarav"
    )
    assert connected.portal_id == PortalType.INDEED
    assert connected.username == "aarav_indeed"
    assert connected.status == "CONNECTED"


def test_audit_profile_weak_verbs_and_xyz(sample_profile):
    extractor = PortalAccountExtractor()
    report = extractor.audit_profile_and_suggest_changes(sample_profile)
    
    assert 40 <= report.overall_profile_score <= 100
    assert len(report.headline_suggestions) >= 2
    assert len(report.missing_high_demand_skills) > 0
    assert report.quantified_impact_ratio > 0.0

    # Weak verb 'Responsible for' must be flagged and replaced with active verb
    assert len(report.bullet_improvements) > 0
    found_replacement = any("Spearheaded and delivered" in s.suggested_text for s in report.bullet_improvements)
    assert found_replacement is True

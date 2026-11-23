import pytest
from packages.contracts.models import CandidateProfile
from services.api.engine.intelligence.social_post_scanner import SocialHiringPostScanner


@pytest.fixture
def sample_profile():
    return CandidateProfile(
        user_id="test_user",
        full_name="Pooja Verma",
        email="pooja@example.com",
        phone="+91-9876543210",
        location="Remote, India",
        skills=["Python", "React", "Next.js", "Docker", "FastAPI"],
        experience=[
            {
                "title": "Senior Full-Stack Engineer",
                "company": "TechVentures",
                "bullets": ["Scaled web app to 500k users."]
            }
        ]
    )


def test_list_curated_feed():
    scanner = SocialHiringPostScanner()
    feed = scanner.list_feed()
    assert len(feed) >= 4
    for post in feed:
        assert post.post_id.startswith("post_")
        assert post.company_name != ""
        assert post.raw_post_text != ""
        assert post.extracted_job_title != ""


def test_parse_and_score_informal_post(sample_profile):
    scanner = SocialHiringPostScanner()
    raw_post = (
        "We at Razorpay are expanding our team! Looking for a Senior Full-Stack Engineer "
        "with deep expertise in Python, React, and Next.js to scale payment gateways. "
        "Write to me directly at hiring.manager@razorpay.com."
    )
    parsed = scanner.parse_raw_post(
        raw_text=raw_post,
        poster_name="Karan Malhotra",
        source_platform="LinkedIn"
    )
    assert parsed.company_name == "Razorpay"
    assert parsed.poster_contact == "hiring.manager@razorpay.com"
    assert "Python" in parsed.tech_stack
    assert "React" in parsed.tech_stack
    assert "Next.js" in parsed.tech_stack

    # Score against candidate profile
    scored = scanner.score_post_against_profile(parsed, sample_profile)
    assert scored.match_score >= 80
    assert "Python" in scored.matched_skills
    assert sample_profile.full_name in scored.suggested_outreach_body

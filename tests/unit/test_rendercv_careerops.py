"""
Unit tests for RenderCV Compiler, Career-Ops XYZ Profiler, and STAR Interview Prep.
"""

import json
import pytest
from packages.contracts.models import CandidateProfile, JobPosting, EvidenceItem
from services.api.engine.resume.tailor import ResumeTailor
from services.api.engine.resume.rendercv_compiler import RenderCVCompiler, CareerOpsAnalyzer
from services.api.engine.intelligence.interview_star import STARInterviewEngine
from services.api.engine.discovery.portal_selectors import get_portal_selectors, PORTAL_SELECTORS_REGISTRY


@pytest.fixture
def sample_candidate():
    return CandidateProfile(
        user_id="usr_ayush_01",
        full_name="Ayush Narkhede",
        email="ayush.narkhede@example.com",
        phone="+91 98765 43210",
        location="Pune, India",
        work_authorization="Authorized",
        skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Redis"],
        experience=[
            {
                "company": "NextGen Systems",
                "title": "Senior Systems Engineer",
                "dates": "2023-01 — Present",
                "bullets": [
                    "Architected REST APIs handling 10,000 requests/minute with 99.9% uptime",
                    "Optimized database query latency by 42% using index tuning and Redis caching"
                ]
            }
        ],
        evidence=[
            EvidenceItem(
                id="ev_exp_01",
                user_id="usr_ayush_01",
                field_path="experience[0].bullets[0]",
                verified_claim="Architected REST APIs handling 10,000 requests/minute with 99.9% uptime",
                metric_citation="10,000 requests/minute and 99.9% uptime"
            ),
            EvidenceItem(
                id="ev_exp_02",
                user_id="usr_ayush_01",
                field_path="experience[0].bullets[1]",
                verified_claim="Optimized database query latency by 42% using index tuning and Redis caching",
                metric_citation="42% latency reduction"
            )
        ]
    )


@pytest.fixture
def sample_job():
    return JobPosting(
        id="job_stripe_01",
        source_id="greenhouse_stripe",
        source_name="greenhouse",
        company_name="Stripe",
        job_title="Distributed Systems Engineer",
        location="Remote, India",
        work_mode="Remote",
        canonical_url="https://boards.greenhouse.io/stripe/jobs/01",
        jd_raw_text="Seeking Senior Engineer with Python, PostgreSQL, Redis, and high-throughput REST APIs.",
        must_have_skills=["Python", "PostgreSQL", "Redis"]
    )


def test_rendercv_yaml_generation(sample_candidate, sample_job):
    tailored = ResumeTailor.tailor_resume(sample_candidate, sample_job)
    yaml_output = RenderCVCompiler.compile_yaml(sample_candidate, tailored, theme="engineeringresumes")

    assert "cv:" in yaml_output
    assert "name: Ayush Narkhede" in yaml_output
    assert "theme: engineeringresumes" in yaml_output
    assert "10,000 requests/minute" in yaml_output
    assert "42%" in yaml_output
    assert len(tailored.sha256_hash) == 64


def test_latex_and_typst_compilation(sample_candidate, sample_job):
    tailored = ResumeTailor.tailor_resume(sample_candidate, sample_job)
    latex_output = RenderCVCompiler.compile_latex_moderncv(sample_candidate, tailored)
    typst_output = RenderCVCompiler.compile_typst(sample_candidate, tailored)

    assert r"\documentclass[11pt,a4paper,sans]{moderncv}" in latex_output
    assert r"\moderncvstyle{banking}" in latex_output
    assert "#set page(paper: \"us-letter\"" in typst_output
    assert "Ayush Narkhede" in typst_output


def test_career_ops_xyz_formula_evaluation(sample_candidate):
    bullets = sample_candidate.experience[0]["bullets"]
    analysis = CareerOpsAnalyzer.analyze_bullets(bullets)

    assert analysis["total_bullets_analyzed"] == 2
    assert analysis["xyz_compliant_bullets"] == 2
    assert analysis["xyz_compliance_rate_pct"] == 100
    assert analysis["overall_career_ops_score"] >= 80
    assert analysis["quality_tier"] in ["STRONG", "ELITE"]
    assert "42%" in analysis["bullet_breakdowns"][1]["metrics_detected"]
    assert "99.9%" in analysis["bullet_breakdowns"][0]["metrics_detected"]


def test_star_interview_story_synthesis(sample_candidate, sample_job):
    stories = STARInterviewEngine.generate_star_stories(sample_candidate, sample_job)

    assert len(stories) == 4
    for s in stories:
        assert "situation" in s["star_framework"]
        assert "task" in s["star_framework"]
        assert "action" in s["star_framework"]
        assert "result" in s["star_framework"]
        assert s["evidence_citation"].startswith("ev_")
        assert len(s["talking_points"]) >= 2


def test_portal_selectors_registry():
    instahyre = get_portal_selectors("https://www.instahyre.com/job-123")
    assert instahyre["portal_name"] == "Instahyre"
    assert "view_job_button" in instahyre["selectors"]

    wellfound = get_portal_selectors("https://wellfound.com/jobs/456")
    assert wellfound["portal_name"] == "Wellfound (AngelList)"
    assert "cover_note_input" in wellfound["selectors"]

    greenhouse = get_portal_selectors("boards.greenhouse.io")
    assert greenhouse["portal_name"] == "Greenhouse"
    assert "resume_upload" in greenhouse["selectors"]

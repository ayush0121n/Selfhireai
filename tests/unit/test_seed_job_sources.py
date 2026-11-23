"""
Unit tests for Job Sources & Company Career Pages Seeder.
Verifies:
- Classification rules (API_FEED vs EXTENSION_ASSIST vs MANUAL_LINK)
- Policy enforcement (LinkedIn & Indeed are RESTRICTED, public feeds are APPROVED)
- ATS platform detection from URLs
- Idempotency of database insertion
"""

import os
import sqlite3
import pytest
from scripts.seed_job_sources import (
    classify_board, detect_ats_platform, seed_job_sources
)


def test_classify_api_feed_sources():
    cat, mode, status, domain = classify_board(
        "RemoteOK", "https://remoteok.com/api", "Public remote developer jobs feed", "Remote"
    )
    assert mode == "API_FEED"
    assert status == "APPROVED"
    assert domain == "remoteok.com"

    cat, mode, status, domain = classify_board(
        "Jobicy", "https://jobicy.com/jobs", "Remote jobs API and board", "Remote"
    )
    assert mode == "API_FEED"
    assert status == "APPROVED"


def test_classify_restricted_manual_link_portals():
    cat, mode, status, domain = classify_board(
        "LinkedIn Jobs", "https://www.linkedin.com/jobs", "Professional career network", "General"
    )
    assert mode == "MANUAL_LINK"
    assert status == "RESTRICTED"

    cat, mode, status, domain = classify_board(
        "Indeed India", "https://in.indeed.com", "Job search portal", "India"
    )
    assert mode == "MANUAL_LINK"
    assert status == "RESTRICTED"


def test_classify_career_tool_utility():
    cat, mode, status, domain = classify_board(
        "Resume Roaster", "https://resumeroast.com", "Free AI resume checker and feedback tool", "Job Search Tools"
    )
    assert cat == "CAREER_TOOL"
    assert mode == "MANUAL_LINK"


def test_detect_ats_platform_urls():
    ats, mode, status = detect_ats_platform("https://razorpay.darwinbox.in/jobs")
    assert ats == "Darwinbox"
    assert mode == "EXTENSION_ASSIST"
    assert status == "APPROVED"

    ats, mode, status = detect_ats_platform("https://stripe.greenhouse.io")
    assert ats == "Greenhouse"
    assert mode == "EXTENSION_ASSIST"
    assert status == "APPROVED"

    ats, mode, status = detect_ats_platform("https://jobs.lever.co/figma")
    assert ats == "Lever"
    assert mode == "EXTENSION_ASSIST"
    assert status == "APPROVED"

    ats, mode, status = detect_ats_platform("https://www.linkedin.com/company/apple/jobs")
    assert ats == "LinkedIn"
    assert mode == "MANUAL_LINK"
    assert status == "RESTRICTED"


def test_idempotent_seeding_into_test_db(tmp_path):
    test_db = str(tmp_path / "test_selfhire.db")
    
    # Run first time
    res1 = seed_job_sources(db_path=test_db)
    assert res1["total_sources_in_db"] > 1000
    assert res1["total_companies_in_db"] > 600

    # Run second time - should be completely idempotent (0 new items)
    res2 = seed_job_sources(db_path=test_db)
    assert res2["boards_seeded_new"] == 0
    assert res2["companies_seeded_new"] == 0
    assert res2["total_sources_in_db"] == res1["total_sources_in_db"]

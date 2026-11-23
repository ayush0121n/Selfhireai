"""
SelfHire.ai Idempotent Job Sources & Worldwide Companies Seeder.
Ingests:
1. data/sources/awesome_job_boards.md -> public.job_sources
2. data/sources/companies_worldwide.md -> public.company_career_pages & public.job_sources
Enforces strict policy safety:
- API_FEED / APPROVED for public JSON/RSS/XML/MCP/ATS feeds
- EXTENSION_ASSIST / APPROVED for standard career portals & vetted Indian boards
- MANUAL_LINK / RESTRICTED for LinkedIn, Indeed & government portals
- Tags utility tools as CAREER_TOOL
"""

import os
import re
import sqlite3
import urllib.parse
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple


DB_PATH = "data/selfhire.db"
AWESOME_BOARDS_PATH = "data/sources/awesome_job_boards.md"
COMPANIES_WORLDWIDE_PATH = "data/sources/companies_worldwide.md"

API_FEED_DOMAINS = {
    "remoteok.com", "jobicy.com", "remotive.com", "warpjobs.com", "presentofai.com",
    "open-career-index.printfilestudio.workers.dev", "remote-jobs-api.tten.no",
    "yubhub.co", "jobsweep.works", "sottava.com", "headcountlabs.com", "spinhire.io",
    "openradar.fun", "api.github.com", "hn.algolia.com", "github.com/j-delaney",
    "github.com/ai-job-search-dev", "github.com/cookllm"
}

RESTRICTED_DOMAINS = {
    "linkedin.com", "indeed.com", "glassdoor.com", "usajobs.gov", "usa.jobs",
    "arbetsformedlingen.se", "tyomarkkinatori.fi"
}

CAREER_TOOL_KEYWORDS = [
    "resume checker", "cv check", "checker", "roast", "interview practice",
    "mock interview", "gap checker", "ats score", "resume builder"
]


def detect_ats_platform(url: str) -> Tuple[str, str, str]:
    """
    Detects ATS platform from URL.
    Returns: (ats_platform, automation_mode, policy_status)
    """
    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc.lower()
    path = parsed.path.lower()
    full_url = url.lower()

    if "darwinbox" in domain or "darwinbox" in path:
        return "Darwinbox", "EXTENSION_ASSIST", "APPROVED"
    elif "workday" in domain or "myworkdayjobs" in domain:
        return "Workday", "EXTENSION_ASSIST", "APPROVED"
    elif "greenhouse.io" in domain or "boards.greenhouse.io" in full_url:
        return "Greenhouse", "EXTENSION_ASSIST", "APPROVED"
    elif "lever.co" in domain or "jobs.lever.co" in full_url:
        return "Lever", "EXTENSION_ASSIST", "APPROVED"
    elif "breezy.hr" in domain:
        return "Breezy HR", "EXTENSION_ASSIST", "APPROVED"
    elif "freshteam.com" in domain:
        return "Freshteam", "EXTENSION_ASSIST", "APPROVED"
    elif "keka.com" in domain:
        return "Keka", "EXTENSION_ASSIST", "APPROVED"
    elif "skillate.com" in domain:
        return "Skillate", "EXTENSION_ASSIST", "APPROVED"
    elif "oraclecloud.com" in domain:
        return "Oracle Cloud HCM", "EXTENSION_ASSIST", "APPROVED"
    elif "recruiterflow.com" in domain:
        return "Recruiterflow", "EXTENSION_ASSIST", "APPROVED"
    elif "linkedin.com" in domain:
        return "LinkedIn", "MANUAL_LINK", "RESTRICTED"
    elif "indeed.com" in domain:
        return "Indeed", "MANUAL_LINK", "RESTRICTED"
    elif "smartrecruiters.com" in domain:
        return "SmartRecruiters", "EXTENSION_ASSIST", "APPROVED"
    elif "ashbyhq.com" in domain:
        return "Ashby", "EXTENSION_ASSIST", "APPROVED"
    else:
        return "Direct Career Portal", "EXTENSION_ASSIST", "APPROVED"


def classify_board(name: str, url: str, desc: str, category: str) -> Tuple[str, str, str, str]:
    """
    Classifies a job board entry into (category, automation_mode, policy_status, domain).
    """
    domain = urllib.parse.urlparse(url).netloc.lower()
    if domain.startswith("www."):
        domain = domain[4:]

    # Check if career tool (resume roasters / checkers)
    is_tool = any(kw in name.lower() or kw in desc.lower() for kw in CAREER_TOOL_KEYWORDS)
    if is_tool or category.lower() == "job search tools":
        # If it doesn't offer actual job search or roles, categorize as CAREER_TOOL
        if not ("job" in desc.lower() or "jobs" in desc.lower() or "roles" in desc.lower() or "listing" in desc.lower()):
            return "CAREER_TOOL", "MANUAL_LINK", "APPROVED", domain

    # Check API feed
    is_api = (
        any(f_dom in domain for f_dom in API_FEED_DOMAINS)
        or "api" in desc.lower()
        or "rss" in desc.lower()
        or "xml" in desc.lower()
        or "mcp" in desc.lower()
    )
    if is_api:
        return category, "API_FEED", "APPROVED", domain

    # Check Restricted
    is_restricted = (
        any(r_dom in domain for r_dom in RESTRICTED_DOMAINS)
        or "government" in desc.lower()
        or "public sector" in desc.lower()
    )
    if is_restricted:
        return category, "MANUAL_LINK", "RESTRICTED", domain

    # Standard Vetted Extension Assist
    return category, "EXTENSION_ASSIST", "APPROVED", domain


def seed_job_sources(db_path: str = DB_PATH) -> Dict[str, int]:
    """Idempotently creates tables and seeds job sources and company career pages."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Ensure Table Schemas
    cur.execute("""
        CREATE TABLE IF NOT EXISTS job_sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            portal_name TEXT,
            domain TEXT,
            category TEXT,
            website_url TEXT,
            policy_url TEXT,
            description TEXT,
            automation_mode TEXT DEFAULT 'EXTENSION_ASSIST',
            policy_status TEXT DEFAULT 'APPROVED',
            created_at TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS company_career_pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            career_url TEXT NOT NULL,
            domain TEXT,
            ats_platform TEXT,
            automation_mode TEXT DEFAULT 'EXTENSION_ASSIST',
            policy_status TEXT DEFAULT 'APPROVED',
            created_at TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            source_id TEXT,
            source_name TEXT,
            company_name TEXT NOT NULL,
            title TEXT NOT NULL,
            canonical_url TEXT NOT NULL UNIQUE,
            location_raw TEXT,
            work_mode TEXT DEFAULT 'REMOTE',
            salary_raw TEXT,
            jd_text TEXT,
            jd_hash TEXT NOT NULL,
            extracted_keywords TEXT,
            first_seen_at TEXT,
            last_verified_at TEXT,
            is_live INTEGER DEFAULT 1
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS job_matches (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            overall_match_percentage INTEGER NOT NULL,
            matched_skills TEXT,
            missing_skills TEXT,
            match_explanation TEXT,
            computed_at TEXT
        )
    """)

    now_iso = datetime.now(timezone.utc).isoformat()

    # 2. Parse & Ingest awesome_job_boards.md
    boards_seeded = 0
    if os.path.exists(AWESOME_BOARDS_PATH):
        with open(AWESOME_BOARDS_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()

        current_category = "General"
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            if line_str.startswith("## ") or line_str.startswith("### "):
                current_category = line_str.lstrip("#").strip()
                continue

            match = re.match(r"^-\s*\[(.*?)\]\((.*?)\)(?:\s*[-–—:]\s*(.*))?$", line_str)
            if match:
                name = match.group(1).strip()
                url = match.group(2).strip()
                desc = (match.group(3) or "").strip()

                # Skip internal table of contents anchor tags
                if url.startswith("#") or not url.startswith("http"):
                    continue

                cat, mode, status, domain = classify_board(name, url, desc, current_category)

                # Idempotent insert / update
                cur.execute("""
                    SELECT id FROM job_sources WHERE website_url = ? OR (name = ? AND domain = ?)
                """, (url, name, domain))
                row = cur.fetchone()

                if row:
                    cur.execute("""
                        UPDATE job_sources
                        SET name = ?, portal_name = ?, domain = ?, category = ?, description = ?,
                            automation_mode = ?, policy_status = ?, policy_url = ?
                        WHERE id = ?
                    """, (name, name, domain, cat, desc, mode, status, url, row[0]))
                else:
                    cur.execute("""
                        INSERT INTO job_sources (
                            name, portal_name, domain, category, website_url, policy_url,
                            description, automation_mode, policy_status, created_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (name, name, domain, cat, url, url, desc, mode, status, now_iso))
                    boards_seeded += 1

    # 3. Parse & Ingest companies_worldwide.md
    companies_seeded = 0
    if os.path.exists(COMPANIES_WORLDWIDE_PATH):
        with open(COMPANIES_WORLDWIDE_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            match = re.match(r"^-\s*\*\*(.*?)\*\*:\s*\[.*?\]\((.*?)\)", line_str)
            if match:
                company_name = match.group(1).strip()
                url = match.group(2).strip()

                if not url.startswith("http"):
                    continue

                ats, mode, status = detect_ats_platform(url)
                domain = urllib.parse.urlparse(url).netloc.lower()
                if domain.startswith("www."):
                    domain = domain[4:]

                # Seed company_career_pages
                cur.execute("""
                    SELECT id FROM company_career_pages WHERE career_url = ? OR company_name = ?
                """, (url, company_name))
                row = cur.fetchone()

                if row:
                    cur.execute("""
                        UPDATE company_career_pages
                        SET company_name = ?, career_url = ?, domain = ?, ats_platform = ?,
                            automation_mode = ?, policy_status = ?
                        WHERE id = ?
                    """, (company_name, url, domain, ats, mode, status, row[0]))
                else:
                    cur.execute("""
                        INSERT INTO company_career_pages (
                            company_name, career_url, domain, ats_platform, automation_mode, policy_status, created_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (company_name, url, domain, ats, mode, status, now_iso))
                    companies_seeded += 1

                # Also insert into job_sources with category = 'Direct Employer Career Page'
                desc = f"Official career page for {company_name}. Powered by {ats}."
                cur.execute("""
                    SELECT id FROM job_sources WHERE website_url = ?
                """, (url,))
                js_row = cur.fetchone()
                if not js_row:
                    cur.execute("""
                        INSERT INTO job_sources (
                            name, portal_name, domain, category, website_url, policy_url,
                            description, automation_mode, policy_status, created_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (f"{company_name} Careers", f"{company_name} Careers", domain,
                          "Direct Employer Career Page", url, url, desc, mode, status, now_iso))

    conn.commit()

    # Query totals
    total_sources = cur.execute("SELECT count(*) FROM job_sources").fetchone()[0]
    total_companies = cur.execute("SELECT count(*) FROM company_career_pages").fetchone()[0]
    total_approved = cur.execute("SELECT count(*) FROM job_sources WHERE policy_status = 'APPROVED'").fetchone()[0]
    total_api_feeds = cur.execute("SELECT count(*) FROM job_sources WHERE automation_mode = 'API_FEED'").fetchone()[0]
    total_restricted = cur.execute("SELECT count(*) FROM job_sources WHERE policy_status = 'RESTRICTED'").fetchone()[0]

    conn.close()

    return {
        "boards_seeded_new": boards_seeded,
        "companies_seeded_new": companies_seeded,
        "total_sources_in_db": total_sources,
        "total_companies_in_db": total_companies,
        "total_approved": total_approved,
        "total_api_feeds": total_api_feeds,
        "total_restricted": total_restricted
    }


if __name__ == "__main__":
    result = seed_job_sources()
    print("Idempotent Job Sources Seeder Finished:")
    for k, v in result.items():
        print(f"  {k}: {v}")


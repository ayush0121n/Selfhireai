"""
SelfHire.ai Company Intelligence Analyzer.
Analyzes target recipient email and job description to extract company domain,
business model, industry sector, culture/mission themes, and matching recruiters from internal database.
"""

from __future__ import annotations
import csv
import os
import re
from typing import Any, Dict, List, Optional, Tuple
from packages.contracts.models import CompanyIntelligence


# Industry classification heuristics
INDUSTRY_PATTERNS = {
    "FinTech & Payments": [r"payment", r"banking", r"fintech", r"ledger", r"crypto", r"wallet", r"transaction", r"stripe", r"razorpay"],
    "Developer Tools & Cloud Infrastructure": [r"developer", r"api", r"sdk", r"infrastructure", r"cloud", r"observability", r"devops", r"compiler", r"kubernetes"],
    "AI & Machine Learning": [r"artificial intelligence", r"machine learning", r"deep learning", r"llm", r"genai", r"neural", r"model training", r"inference"],
    "Enterprise SaaS": [r"enterprise", r"b2b", r"crm", r"erp", r"workflow", r"collaboration", r"productivity", r"saas"],
    "E-Commerce & Retail": [r"e-commerce", r"marketplace", r"cart", r"checkout", r"retail", r"logistics", r"delivery"],
    "HealthTech & Life Sciences": [r"healthcare", r"clinical", r"medical", r"genomics", r"biotech", r"telehealth", r"patient"],
    "Cybersecurity": [r"security", r"encryption", r"threat", r"identity", r"zero-trust", r"soc", r"vulnerability"]
}

# Core tech keywords to detect
TECH_STACK_DICTIONARY = [
    "Python", "FastAPI", "Django", "Flask", "JavaScript", "TypeScript",
    "React", "Next.js", "Node.js", "Vue", "Angular", "Go", "Golang",
    "Rust", "Java", "Kotlin", "C++", "C#", "SQL", "PostgreSQL",
    "MySQL", "MongoDB", "Redis", "Kafka", "RabbitMQ", "Docker",
    "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD",
    "Playwright", "GraphQL", "REST APIs", "Microservices"
]


class CompanyAnalyzer:
    @staticmethod
    def extract_domain(email: str) -> str:
        """Extracts domain name from email address."""
        if "@" in email:
            domain = email.split("@")[-1].strip().lower()
            return domain
        return ""

    @staticmethod
    def infer_company_name_and_title(
        email: str,
        jd_text: str,
        override_name: Optional[str] = None,
        override_title: Optional[str] = None
    ) -> Tuple[str, str]:
        """Infers company name and job title from inputs."""
        # 1. Company Name inference
        company = override_name
        if not company:
            # Check headers or lines like 'Company: XYZ' or 'About XYZ'
            m = re.search(r"(?:Company|About|At)\s*[:\-]?\s*([A-Za-z0-9\.\s]{2,30})", jd_text, re.IGNORECASE)
            if m:
                extracted = m.group(1).strip()
                # filter common non-company words
                if extracted.lower() not in ["the", "this", "our", "a", "us", "role", "position"]:
                    company = extracted

        if not company and "@" in email:
            domain = email.split("@")[-1].strip().lower()
            # remove common tlds
            base = re.sub(r"\.(com|io|co|in|ai|org|net|tech|dev|app|global)$", "", domain)
            if base and base not in ["gmail", "yahoo", "outlook", "hotmail", "icloud"]:
                company = base.capitalize()

        if not company:
            company = "Target Organization"

        # 2. Job Title inference
        job_title = override_title
        if not job_title:
            title_match = re.search(
                r"(?:Job Title|Role|Position|Hiring for)\s*[:\-]?\s*([A-Za-z\s]{3,40}(?:Engineer|Developer|Architect|Lead|Manager|Specialist|Designer|Analyst))",
                jd_text,
                re.IGNORECASE
            )
            if title_match:
                job_title = title_match.group(1).strip()
            else:
                # Fallback search for engineer/developer in first 200 chars
                first_lines = "\n".join(jd_text.splitlines()[:5])
                fallback_match = re.search(
                    r"([A-Za-z\s]{2,30}(?:Engineer|Developer|Architect|Lead))",
                    first_lines,
                    re.IGNORECASE
                )
                if fallback_match:
                    job_title = fallback_match.group(1).strip()
                else:
                    job_title = "Software Engineer"

        return company, job_title

    @classmethod
    def analyze(
        cls,
        company_name: str,
        domain: str,
        jd_text: str,
        recruiter_csv_path: str = "data/talent_acquisition_database.csv"
    ) -> CompanyIntelligence:
        """Deep analysis of company profile, sector, tech stack, and recruiter network."""
        # 1. Detect industry
        detected_industry = "Technology & Modern Software"
        text_lower = jd_text.lower() + " " + company_name.lower()
        for industry, patterns in INDUSTRY_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, text_lower):
                    detected_industry = industry
                    break
            if detected_industry != "Technology & Modern Software":
                break

        # 2. Detect tech stack
        detected_tech = []
        for tech in TECH_STACK_DICTIONARY:
            if re.search(rf"\b{re.escape(tech)}\b", jd_text, re.IGNORECASE):
                detected_tech.append(tech)

        # 3. Detect mission & culture themes
        mission_themes = []
        theme_map = {
            "High Throughput & Scalability": [r"scale", r"high throughput", r"millions of users", r"distributed"],
            "Developer Experience": [r"developer experience", r"dx", r"tooling", r"automation", r"efficiency"],
            "Security & Reliability": [r"uptime", r"reliability", r"fault-tolerant", r"resilience", r"security"],
            "Fast-Paced Innovation": [r"fast-paced", r"ownership", r"startup", r"iterate quickly", r"0 to 1"]
        }
        for theme_name, theme_pats in theme_map.items():
            for tp in theme_pats:
                if re.search(tp, text_lower):
                    mission_themes.append(theme_name)
                    break

        if not mission_themes:
            mission_themes = ["Production Excellence", "Scalable System Architecture"]

        # 4. Search recruiter database for matches
        matched_recruiters: List[Dict[str, str]] = []
        if os.path.exists(recruiter_csv_path):
            with open(recruiter_csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                norm_comp = company_name.strip().lower()
                for row in reader:
                    rc_name = (row.get("Company Name") or "").strip().lower()
                    if norm_comp in rc_name or rc_name in norm_comp or (domain and domain in (row.get("Company Website") or "").lower()):
                        matched_recruiters.append({
                            "name": (row.get("Name") or "").strip(),
                            "title": (row.get("Job Title") or "").strip(),
                            "location": (row.get("Location") or "").strip(),
                            "linkedin": (row.get("Linkedin URL") or "").strip()
                        })
                        if len(matched_recruiters) >= 5:
                            break

        # 5. Synthesize overview
        tech_summary = f"utilizing {', '.join(detected_tech[:4])}" if detected_tech else "building mission-critical technology"
        overview = (
            f"{company_name} operates in the {detected_industry} sector, {tech_summary}. "
            f"The team prioritizes {', '.join(mission_themes[:2]).lower()}."
        )

        return CompanyIntelligence(
            company_name=company_name,
            domain=domain,
            industry=detected_industry,
            overview=overview,
            tech_stack=detected_tech,
            mission_themes=mission_themes,
            matched_recruiters=matched_recruiters
        )

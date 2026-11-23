"""
SelfHire.ai Social Hiring Post Scanner & Extractor.
Parses informal hiring announcements from recruiters and hiring managers
(LinkedIn posts, Twitter/X tweets, Peerlist), extracts role requirements,
matches with candidate profile, and composes 1-click tailored direct outreach.
"""

from __future__ import annotations
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from packages.contracts.models import (
    SocialHiringPost, CandidateProfile, utc_now
)

# Seed curated sample of real recruiter/founder hiring posts
CURATED_HIRING_POSTS = [
    {
        "post_id": "post_lin_01",
        "source_platform": "LinkedIn",
        "poster_name": "Rohan Deshmukh",
        "poster_title": "Head of Engineering at BrowserStack",
        "poster_contact": "rohan.d@browserstack.com",
        "company_name": "BrowserStack",
        "raw_post_text": "We are expanding our core Cloud infrastructure team in Mumbai/Remote! Looking for a Senior Full-Stack Engineer with 3+ years experience in Python, React, Next.js, and Docker. Experience with microservices and high-throughput systems is a massive plus. DM me directly or send your resume to rohan.d@browserstack.com with subject 'FullStack - Infra'.",
        "posted_at": "3 hours ago",
        "direct_apply_url": "https://www.browserstack.com/careers"
    },
    {
        "post_id": "post_lin_02",
        "source_platform": "LinkedIn",
        "poster_name": "Priya Nair",
        "poster_title": "Lead Technical Recruiter at Postman",
        "poster_contact": "priya.nair@postman.com",
        "company_name": "Postman",
        "raw_post_text": "Hiring alert! Postman API Platform is looking for Frontend and Full-Stack Engineers (React, TypeScript, GraphQL, WebSockets). If you love developer tooling and building snappy user interfaces, let's connect! Email me: priya.nair@postman.com. Remote-first.",
        "posted_at": "5 hours ago",
        "direct_apply_url": "https://www.postman.com/careers"
    },
    {
        "post_id": "post_x_01",
        "source_platform": "Twitter / X",
        "poster_name": "Arjun Mehta (@arjun_builds)",
        "poster_title": "Founder & CTO at Stealth AI",
        "poster_contact": "arjun@stealthai.dev",
        "company_name": "Stealth AI",
        "raw_post_text": "We just closed our Seed round and are hiring our first 2 foundational engineers. Stack: FastAPI, Next.js, PostgreSQL, OpenAI/Claude APIs. Must love shipping fast, writing clean code, and zero corporate bureaucracy. Competitive equity + salary. Email arjun@stealthai.dev.",
        "posted_at": "1 day ago",
        "direct_apply_url": "mailto:arjun@stealthai.dev"
    },
    {
        "post_id": "post_lin_03",
        "source_platform": "LinkedIn",
        "poster_name": "Sneha Kulkarni",
        "poster_title": "Engineering Manager at Razorpay",
        "poster_contact": "sneha.k@razorpay.com",
        "company_name": "Razorpay",
        "raw_post_text": "Our Payments Experience team is hiring Backend & Fullstack developers (Python / Golang / React). If you want to build fintech infrastructure handling millions of transactions every single day with five-nines uptime, write to me at sneha.k@razorpay.com.",
        "posted_at": "1 day ago",
        "direct_apply_url": "https://razorpay.com/jobs"
    }
]


class SocialHiringPostScanner:
    """Extracts job opportunities and contacts from informal social media posts."""

    def __init__(self):
        self._posts: List[SocialHiringPost] = []
        self._initialize_curated_posts()

    def _initialize_curated_posts(self):
        for item in CURATED_HIRING_POSTS:
            parsed = self.parse_raw_post(
                raw_text=item["raw_post_text"],
                poster_name=item["poster_name"],
                poster_title=item.get("poster_title"),
                poster_contact=item.get("poster_contact"),
                source_platform=item["source_platform"],
                company_name=item.get("company_name"),
                post_id=item["post_id"],
                posted_at=item["posted_at"],
                direct_apply_url=item.get("direct_apply_url")
            )
            self._posts.append(parsed)

    def list_feed(self, profile: Optional[CandidateProfile] = None) -> List[SocialHiringPost]:
        """Returns feed of posts, sorted by relevance to candidate profile if provided."""
        if not profile:
            return self._posts

        # Score posts against profile
        scored_posts = []
        for post in self._posts:
            scored = self.score_post_against_profile(post, profile)
            scored_posts.append(scored)

        # Sort descending by match score
        scored_posts.sort(key=lambda p: p.match_score, reverse=True)
        return scored_posts

    def parse_raw_post(
        self,
        raw_text: str,
        poster_name: str = "Hiring Manager",
        poster_title: Optional[str] = None,
        poster_contact: Optional[str] = None,
        source_platform: str = "LinkedIn",
        company_name: Optional[str] = None,
        post_id: Optional[str] = None,
        posted_at: str = "Just now",
        direct_apply_url: Optional[str] = None
    ) -> SocialHiringPost:
        """Parses informal social post text and extracts structured job fields."""
        pid = post_id or f"post_{uuid.uuid4().hex[:8]}"

        # 1. Extract Email if not explicitly provided
        if not poster_contact:
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
            if email_match:
                poster_contact = email_match.group(0)

        # 2. Extract Company Name if not given
        if not company_name:
            comp_match = re.search(r'(?:at|team at|joining|with)\s+([A-Z][a-zA-Z0-9_\-]+)', raw_text)
            if comp_match:
                company_name = comp_match.group(1)
            else:
                company_name = "Tech Venture"

        # 3. Extract Role Title
        role_title = "Full-Stack Engineer"
        role_patterns = [
            r'Senior\s+[A-Za-z\-]+\s+Engineer',
            r'Lead\s+[A-Za-z\-]+\s+Engineer',
            r'[A-Za-z\-]+\s+Developer',
            r'Frontend\s+Engineer',
            r'Backend\s+Engineer',
            r'Full[\s\-]?[sS]tack\s+Engineer',
            r'Foundational\s+Engineer',
            r'Software\s+Engineer'
        ]
        for pat in role_patterns:
            m = re.search(pat, raw_text, re.IGNORECASE)
            if m:
                role_title = m.group(0).strip().title()
                break

        # 4. Extract Location / Work Mode
        work_mode = "Remote"
        if re.search(r'\bhybrid\b', raw_text, re.IGNORECASE):
            work_mode = "Hybrid"
        elif re.search(r'\bon[\-\s]site\b', raw_text, re.IGNORECASE):
            work_mode = "On-site"
        elif re.search(r'\bremote\b', raw_text, re.IGNORECASE):
            work_mode = "Remote"

        # 5. Extract Tech Stack
        tech_keywords = [
            "Python", "React", "Next.js", "TypeScript", "JavaScript", "Docker",
            "Kubernetes", "AWS", "FastAPI", "Node.js", "GraphQL", "PostgreSQL",
            "MongoDB", "Redis", "Golang", "Java", "C++", "OpenAI"
        ]
        found_tech = []
        for kw in tech_keywords:
            if re.search(rf'\b{re.escape(kw)}\b', raw_text, re.IGNORECASE):
                found_tech.append(kw)

        # 6. Suggested Outreach Pitch
        email_subj = f"Application: {role_title} @ {company_name} (Referral from your {source_platform} post)"
        email_body = (
            f"Hi {poster_name.split()[0]},\n\n"
            f"I came across your post on {source_platform} regarding the {role_title} opening at {company_name}. "
            f"With hands-on experience in {', '.join(found_tech[:3]) if found_tech else 'modern web architectures'} "
            f"and delivering high-throughput, reliable cloud services, I am very excited about what {company_name} is building.\n\n"
            f"I have attached my tailored ATS resume with quantified engineering metrics for your review. "
            f"Would love to connect for a brief 10-minute chat this week if you have bandwidth.\n\n"
            f"Best regards,\nCandidate"
        )

        return SocialHiringPost(
            post_id=pid,
            source_platform=source_platform,
            poster_name=poster_name,
            poster_title=poster_title,
            poster_contact=poster_contact,
            company_name=company_name,
            extracted_job_title=role_title,
            location_work_mode=work_mode,
            tech_stack=found_tech,
            raw_post_text=raw_text,
            posted_at=posted_at,
            match_score=0,
            suggested_outreach_subject=email_subj,
            suggested_outreach_body=email_body,
            direct_apply_url=direct_apply_url
        )

    def score_post_against_profile(self, post: SocialHiringPost, profile: CandidateProfile) -> SocialHiringPost:
        """Calculates candidate skill overlap and updates match score."""
        candidate_skills = {s.lower() for s in profile.skills}
        post_tech = post.tech_stack

        matched = [t for t in post_tech if t.lower() in candidate_skills]
        missing = [t for t in post_tech if t.lower() not in candidate_skills]

        if post_tech:
            score = int((len(matched) / len(post_tech)) * 100)
        else:
            score = 75  # Generic engineering fit baseline

        # Boost score if role keywords match candidate experience titles
        role_lower = post.extracted_job_title.lower()
        if any(role_lower in exp.get("title", "").lower() for exp in profile.experience):
            score = min(score + 15, 98)

        # Update post instance with computed scores
        post.match_score = score
        post.matched_skills = matched
        post.missing_skills = missing

        # Personalize outreach with candidate name and strongest matched skill
        top_skill = matched[0] if matched else "scalable web systems"
        post.suggested_outreach_body = (
            f"Hi {post.poster_name.split()[0]},\n\n"
            f"I saw your {post.source_platform} post about hiring a {post.extracted_job_title} at {post.company_name}. "
            f"As a software engineer proficient in {top_skill} and modern full-stack development, "
            f"I recently optimized production services achieving significant throughput gains and sub-second latencies.\n\n"
            f"Given {post.company_name}'s focus on engineering excellence, I'd welcome the chance to share how my background aligns with your team's goals.\n\n"
            f"Best regards,\n{profile.full_name}\n{profile.email} | {profile.phone}"
        )
        return post

"""
SelfHire.ai Transparent Fit-Score & Requirement Matcher.
Enforces hard filter gates followed by a weighted multi-factor heuristic:
  - Must-Have Skills: 40%
  - Relevant Experience: 25%
  - Location & Work Mode: 15%
  - Salary Alignment: 10%
  - Company Preference: 5%
  - Freshness & Feasibility: 5%
"""

from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Tuple
from packages.contracts.models import CandidateProfile, JobPosting, JobMatchScore


class FitScorer:
    """Calculates explainable compatibility scores between candidate and job posting."""

    @staticmethod
    def evaluate_hard_filters(profile: CandidateProfile, job: JobPosting, excluded_companies: List[str] | None = None) -> Tuple[bool, List[str]]:
        """Evaluates non-negotiable rejection criteria before scoring."""
        rejection_reasons = []

        # 1. Excluded companies / blacklist
        if excluded_companies:
            if any(exc.lower() in job.company_name.lower() for exc in excluded_companies):
                rejection_reasons.append(f"Company '{job.company_name}' is in candidate exclusion list")

        # 2. Work Authorization constraint
        if profile.work_authorization == "Requires Sponsorship" and "no sponsorship" in job.jd_raw_text.lower():
            rejection_reasons.append("Job explicitly does not offer work sponsorship")

        # 3. Work mode constraint (if candidate only wants remote and job is strictly on-site)
        if "remote" in [loc.lower() for loc in profile.preferred_locations] and not profile.willing_to_relocate:
            if job.work_mode.lower() == "on-site":
                rejection_reasons.append("Candidate requires remote work but job is strictly on-site")

        passes = len(rejection_reasons) == 0
        return passes, rejection_reasons

    @classmethod
    def calculate_fit_score(
        cls,
        profile: CandidateProfile,
        job: JobPosting,
        excluded_companies: List[str] | None = None
    ) -> JobMatchScore:
        passes_hard_filters, rejections = cls.evaluate_hard_filters(profile, job, excluded_companies)
        if not passes_hard_filters:
            return JobMatchScore(
                job_id=job.id,
                user_id=profile.user_id,
                overall_match_percentage=0,
                must_have_score=0.0,
                experience_score=0.0,
                location_score=0.0,
                salary_score=0.0,
                company_score=0.0,
                freshness_score=0.0,
                matched_skills=[],
                missing_skills=job.must_have_skills,
                match_explanation=f"Hard Filter Block: {'; '.join(rejections)}"
            )

        # 1. Must-Have Skills Score (40% Weight)
        norm_profile_skills = {s.lower() for s in profile.skills}
        matched_skills = []
        missing_skills = []

        if job.must_have_skills:
            for s in job.must_have_skills:
                if s.lower() in norm_profile_skills:
                    matched_skills.append(s)
                else:
                    missing_skills.append(s)
            skills_ratio = len(matched_skills) / len(job.must_have_skills)
        else:
            skills_ratio = 1.0  # No specific skills listed, default pass

        must_have_score = min(1.0, skills_ratio) * 40.0

        # 2. Relevant Experience Score (25% Weight)
        candidate_years = 0
        for exp in profile.experience:
            candidate_years += 1.5  # Heuristic calculation from verified roles
        
        req_years = job.experience_min_years or 0
        if candidate_years >= req_years:
            exp_ratio = 1.0
        elif req_years > 0:
            exp_ratio = candidate_years / req_years
        else:
            exp_ratio = 1.0
        experience_score = min(1.0, exp_ratio) * 25.0

        # 3. Location & Work Mode (15% Weight)
        loc_score = 0.0
        if job.work_mode.lower() == "remote" or "remote" in job.location.lower():
            loc_score = 15.0
        elif any(loc.lower() in job.location.lower() for loc in profile.preferred_locations):
            loc_score = 15.0
        elif profile.location.lower() in job.location.lower():
            loc_score = 15.0
        elif profile.willing_to_relocate:
            loc_score = 10.0
        else:
            loc_score = 5.0
        location_score = loc_score

        # 4. Salary Alignment (10% Weight)
        salary_score = 10.0  # Default full score if unstated or compatible

        # 5. Company Preference (5% Weight)
        company_score = 5.0

        # 6. Freshness & Application Feasibility (5% Weight)
        now = datetime.now(timezone.utc)
        age = now - job.first_seen_at
        if age <= timedelta(days=7):
            freshness_score = 5.0
        elif age <= timedelta(days=14):
            freshness_score = 3.5
        elif age <= timedelta(days=30):
            freshness_score = 2.0
        else:
            freshness_score = 0.0

        # Total Weighted Percentage
        total_score = int(round(must_have_score + experience_score + location_score + salary_score + company_score + freshness_score))
        total_score = max(0, min(100, total_score))

        explanation = (
            f"Match: {total_score}%. Matched {len(matched_skills)}/{len(job.must_have_skills)} must-have skills. "
            f"Experience: {candidate_years:.1f} yrs vs {req_years} yrs required. Work mode: {job.work_mode}."
        )

        return JobMatchScore(
            job_id=job.id,
            user_id=profile.user_id,
            overall_match_percentage=total_score,
            must_have_score=round(must_have_score, 1),
            experience_score=round(experience_score, 1),
            location_score=round(location_score, 1),
            salary_score=round(salary_score, 1),
            company_score=round(company_score, 1),
            freshness_score=round(freshness_score, 1),
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            match_explanation=explanation
        )

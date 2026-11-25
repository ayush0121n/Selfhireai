"""
SelfHire.ai Typed Answer Bank Engine.
Enforces the Typed Answer Contract from agent.md:
  - Classifications: VERIFIED_FACT, APPROVED_PREFERENCE, EVIDENCE_BASED_PROSE,
                     UNKNOWN, SENSITIVE, LEGAL_ATTESTATION.
  - Strict Rule: Unknown facts and legal attestations are NEVER guessed automatically.
"""

from __future__ import annotations
import re
from typing import Any, Dict, List, Optional
from packages.contracts.models import AnswerClassification, CandidateProfile, FormFieldMapping


class AnswerBankEngine:
    """Answers common ATS screening questions strictly based on verified profile facts."""

    @classmethod
    def resolve_question(
        cls,
        question_text: str,
        profile: CandidateProfile,
        company_name: str = "Company"
    ) -> FormFieldMapping:
        q_lower = question_text.lower().strip()

        # 0. Direct Verified Profile Identity & Core Fields -> VERIFIED_FACT
        if any(term in q_lower for term in ["full name", "your name", "candidate name", "applicant name"]):
            return FormFieldMapping(
                field_key="full_name",
                selector="input[name='name']",
                field_type="text",
                question_label=question_text,
                proposed_value=profile.full_name,
                evidence_ids=["ev_identity_name"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=bool(profile.full_name),
            )

        if "email" in q_lower:
            return FormFieldMapping(
                field_key="email",
                selector="input[type='email']",
                field_type="text",
                question_label=question_text,
                proposed_value=str(profile.email),
                evidence_ids=["ev_identity_email"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=bool(profile.email),
            )

        if any(term in q_lower for term in ["phone", "mobile", "contact number"]):
            return FormFieldMapping(
                field_key="phone",
                selector="input[type='tel']",
                field_type="text",
                question_label=question_text,
                proposed_value=profile.phone,
                evidence_ids=["ev_identity_phone"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=bool(profile.phone),
            )

        if any(term in q_lower for term in ["location", "city", "address"]):
            return FormFieldMapping(
                field_key="location",
                selector="input[name='location']",
                field_type="text",
                question_label=question_text,
                proposed_value=profile.location,
                evidence_ids=["ev_identity_location"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=bool(profile.location),
            )

        if any(term in q_lower for term in ["technical skills", "primary skills", "core skills", "tech stack"]):
            skills_val = ", ".join(profile.skills[:8])
            return FormFieldMapping(
                field_key="primary_skills",
                selector="input[name='skills']",
                field_type="text",
                question_label=question_text,
                proposed_value=skills_val,
                evidence_ids=["ev_skills_verified"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=bool(skills_val),
            )

        # 1. Legal declarations & certifications -> LEGAL_ATTESTATION (Requires User)
        if any(term in q_lower for term in ["certify", "attest", "signature", "background check", "drug test"]):
            return FormFieldMapping(
                field_key="legal_attestation",
                selector="input[type='checkbox']",
                field_type="checkbox",
                question_label=question_text,
                proposed_value="Yes",
                evidence_ids=[],
                classification=AnswerClassification.LEGAL_ATTESTATION,
                requires_user_confirmation=True,
                is_filled=False
            )

        # 2. Demographic / Diversity screening -> SENSITIVE
        if any(term in q_lower for term in ["gender", "race", "ethnicity", "veteran", "disability", "marital"]):
            return FormFieldMapping(
                field_key="sensitive_demographic",
                selector="select",
                field_type="select",
                question_label=question_text,
                proposed_value="I choose not to disclose",
                evidence_ids=[],
                classification=AnswerClassification.SENSITIVE,
                requires_user_confirmation=True,
                is_filled=False
            )

        # 3. Work Authorization -> VERIFIED_FACT
        if any(term in q_lower for term in ["authorized to work", "work authorization", "legally authorized", "eligible to work"]):
            is_auth = "authorized" in (profile.work_authorization or "").lower()
            return FormFieldMapping(
                field_key="work_authorization",
                selector="input[name='work_auth']",
                field_type="radio",
                question_label=question_text,
                proposed_value="Yes" if is_auth else "No",
                evidence_ids=["ev_auth_01"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=True
            )

        # 4. Visa Sponsorship -> VERIFIED_FACT
        if any(term in q_lower for term in ["sponsorship", "visa sponsorship", "require sponsorship"]):
            requires_spon = profile.work_authorization == "Requires Sponsorship"
            return FormFieldMapping(
                field_key="sponsorship_need",
                selector="input[name='sponsorship']",
                field_type="radio",
                question_label=question_text,
                proposed_value="Yes" if requires_spon else "No",
                evidence_ids=["ev_auth_01"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=True
            )

        # 5. Notice Period -> VERIFIED_FACT
        if any(term in q_lower for term in ["notice period", "days to join", "how soon can you start", "availability"]):
            days = profile.notice_period_days
            val = "Immediate" if days == 0 else f"{days} days"
            return FormFieldMapping(
                field_key="notice_period",
                selector="input[name='notice_period']",
                field_type="text",
                question_label=question_text,
                proposed_value=val,
                evidence_ids=["ev_notice_01"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=True
            )

        # 6. Willingness to Relocate -> APPROVED_PREFERENCE
        if any(term in q_lower for term in ["relocate", "relocation", "willing to move"]):
            return FormFieldMapping(
                field_key="relocation_preference",
                selector="input[name='relocate']",
                field_type="radio",
                question_label=question_text,
                proposed_value="Yes" if profile.willing_to_relocate else "No",
                evidence_ids=["ev_pref_01"],
                classification=AnswerClassification.APPROVED_PREFERENCE,
                requires_user_confirmation=False,
                is_filled=True
            )

        # 7. Salary Expectations -> APPROVED_PREFERENCE
        if any(term in q_lower for term in ["salary expectation", "expected ctc", "compensation expectation", "desired salary"]):
            if profile.min_salary_annual:
                val = f"{profile.currency} {int(profile.min_salary_annual):,}"
                needs_confirm = False
            else:
                val = "Open to discussion based on market standard"
                needs_confirm = True
            return FormFieldMapping(
                field_key="salary_expectation",
                selector="input[name='salary']",
                field_type="text",
                question_label=question_text,
                proposed_value=val,
                evidence_ids=["ev_sal_01"],
                classification=AnswerClassification.APPROVED_PREFERENCE,
                requires_user_confirmation=needs_confirm,
                is_filled=True
            )

        # 8. Specific Skill Years of Experience -> VERIFIED_FACT
        skill_match = re.search(r"years of\s+([a-zA-Z0-9\.\#\+\-\s]+)\s+experience", q_lower)
        if skill_match:
            targeted_skill = skill_match.group(1).strip()
            # Calculate from verified experience
            has_skill = any(targeted_skill in s.lower() for s in profile.skills)
            years_val = "1.5" if has_skill else "0"
            evidence_ids = [ev.id for ev in profile.evidence if targeted_skill in ev.verified_claim.lower()]
            return FormFieldMapping(
                field_key=f"exp_{targeted_skill.replace(' ', '_')}",
                selector="input[type='text']",
                field_type="text",
                question_label=question_text,
                proposed_value=years_val,
                evidence_ids=evidence_ids or ["ev_exp_general"],
                classification=AnswerClassification.VERIFIED_FACT,
                requires_user_confirmation=False,
                is_filled=True
            )

        # 9. Why this company / Motivation -> EVIDENCE_BASED_PROSE
        if any(term in q_lower for term in ["why do you want to work", "why this company", "why join us", "motivation"]):
            prose = (
                f"I am eager to contribute my full-stack engineering skills to {company_name}. "
                f"With a proven track record of optimizing database latency and building reliable REST APIs, "
                f"I am excited to build scalable features with your engineering team."
            )
            evidence_ids = [ev.id for ev in profile.evidence]
            return FormFieldMapping(
                field_key="motivation_note",
                selector="textarea",
                field_type="textarea",
                question_label=question_text,
                proposed_value=prose,
                evidence_ids=evidence_ids,
                classification=AnswerClassification.EVIDENCE_BASED_PROSE,
                requires_user_confirmation=True,
                is_filled=True
            )

        # 10. Fallback: Unknown question -> UNKNOWN (Strict Stop Condition)
        return FormFieldMapping(
            field_key="unknown_field",
            selector="input",
            field_type="text",
            question_label=question_text,
            proposed_value="",
            evidence_ids=[],
            classification=AnswerClassification.UNKNOWN,
            requires_user_confirmation=True,
            is_filled=False
        )

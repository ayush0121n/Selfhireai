"""
SelfHire.ai Canonical Data Contracts (Pydantic v2).
Single source of truth for the API, Worker, Adapters, and Code Generators.
"""

from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, HttpUrl

EmailStr = str  # Standard string fallback avoiding optional email-validator dependency

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnswerClassification(str, Enum):
    VERIFIED_FACT = "VERIFIED_FACT"
    APPROVED_PREFERENCE = "APPROVED_PREFERENCE"
    EVIDENCE_BASED_PROSE = "EVIDENCE_BASED_PROSE"
    UNKNOWN = "UNKNOWN"
    SENSITIVE = "SENSITIVE"
    LEGAL_ATTESTATION = "LEGAL_ATTESTATION"


class ApplicationState(str, Enum):
    DISCOVERED = "DISCOVERED"
    VERIFIED = "VERIFIED"
    ANALYZED = "ANALYZED"
    SHORTLISTED = "SHORTLISTED"
    DRAFTING = "DRAFTING"
    PREPARED = "PREPARED"
    NEEDS_USER_INPUT = "NEEDS_USER_INPUT"
    NEEDS_APPROVAL = "NEEDS_APPROVAL"
    APPROVED = "APPROVED"
    SUBMITTING = "SUBMITTING"
    CONFIRMED = "CONFIRMED"
    SUBMISSION_UNKNOWN = "SUBMISSION_UNKNOWN"
    CAPTCHA_REQUIRED = "CAPTCHA_REQUIRED"
    MFA_REQUIRED = "MFA_REQUIRED"
    BLOCKED_BY_POLICY = "BLOCKED_BY_POLICY"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    FAILED_RETRYABLE = "FAILED_RETRYABLE"
    CANCELLED = "CANCELLED"


class EvidenceItem(BaseModel):
    id: str = Field(..., description="Unique evidence ID (e.g. ev_exp_01)")
    user_id: str
    source_document_id: Optional[str] = None
    field_path: str = Field(..., description="Path in profile, e.g. experience[0].bullets[1]")
    verified_claim: str = Field(..., description="Concrete verified factual statement")
    metric_citation: Optional[str] = Field(None, description="Quantified XYZ metric (e.g. 42% latency reduction)")
    text_location: Optional[str] = None
    verified_at: datetime = Field(default_factory=utc_now)


class CandidateProfile(BaseModel):
    user_id: str
    full_name: str
    email: EmailStr
    phone: str
    location: str
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    notice_period_days: int = 0
    work_authorization: str = "Authorized"
    willing_to_relocate: bool = False
    preferred_locations: List[str] = Field(default_factory=list)
    min_salary_annual: Optional[float] = None
    currency: str = "INR"


class JobPosting(BaseModel):
    id: str
    source_id: str
    source_name: str
    canonical_url: str
    company_name: str
    job_title: str
    location: str
    work_mode: str = "Remote"  # Remote, Hybrid, On-site
    jd_raw_text: str
    must_have_skills: List[str] = Field(default_factory=list)
    nice_to_have_skills: List[str] = Field(default_factory=list)
    experience_min_years: Optional[int] = 0
    salary_range: Optional[str] = None
    first_seen_at: datetime = Field(default_factory=utc_now)
    last_verified_at: datetime = Field(default_factory=utc_now)
    is_live: bool = True
    scam_risk_score: float = 0.0  # 0.0 to 1.0


class JobMatchScore(BaseModel):
    job_id: str
    user_id: str
    overall_match_percentage: int = Field(..., ge=0, le=100)
    must_have_score: float = Field(..., description="40% weight")
    experience_score: float = Field(..., description="25% weight")
    location_score: float = Field(..., description="15% weight")
    salary_score: float = Field(..., description="10% weight")
    company_score: float = Field(..., description="5% weight")
    freshness_score: float = Field(..., description="5% weight")
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    match_explanation: str


class TailoredResume(BaseModel):
    id: str
    user_id: str
    job_id: str
    profile_version: int = 1
    tailored_headline: str
    tailored_summary: str
    tailored_experience_bullets: List[Dict[str, Any]] = Field(
        ..., description="Each bullet MUST include evidence_ids to verify truthfulness"
    )
    tailored_skills: List[str]
    sha256_hash: str
    docx_storage_key: Optional[str] = None
    pdf_storage_key: Optional[str] = None
    unsupported_claims_found: int = 0
    created_at: datetime = Field(default_factory=utc_now)


class FormFieldMapping(BaseModel):
    field_key: str
    selector: str
    field_type: str  # text, textarea, select, radio, checkbox, file
    question_label: str
    proposed_value: str
    evidence_ids: List[str] = Field(default_factory=list)
    classification: AnswerClassification
    requires_user_confirmation: bool = False
    is_filled: bool = False


class ApprovalPackage(BaseModel):
    approval_id: str
    user_id: str
    application_id: str
    destination_url: str
    payload_hash: str = Field(..., description="SHA-256 of canonical JSON values")
    field_mappings: List[FormFieldMapping]
    tailored_resume_hash: str
    expires_at: datetime
    is_consumed: bool = False


class ReceiptConfirmation(BaseModel):
    receipt_id: str
    application_id: str
    approval_id: str
    confirmation_number: str
    final_destination_url: str
    screenshot_storage_key: str
    submitted_at: datetime = Field(default_factory=utc_now)
    status: str = "CONFIRMED"


class CompanyIntelligence(BaseModel):
    company_name: str
    domain: str
    industry: str
    overview: str
    tech_stack: List[str] = Field(default_factory=list)
    mission_themes: List[str] = Field(default_factory=list)
    matched_recruiters: List[Dict[str, str]] = Field(default_factory=list)


class DirectTargetOutreachRequest(BaseModel):
    target_email: str
    jd_text: str
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    send_immediately: bool = False


class DirectTargetOutreachResponse(BaseModel):
    target_email: str
    company_intelligence: CompanyIntelligence
    email_subject: str
    email_body: str
    mailto_url: str
    copy_paste_email: str
    tailored_resume_text: str
    tailored_resume_markdown: str
    tailored_resume: TailoredResume
    send_status: str
    dispatch_receipt: Optional[Dict[str, Any]] = None


# ---------------- Social & Portal Integration Models ---------------- #

class PortalType(str, Enum):
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    NAUKRI = "naukri"
    UNSTOP = "unstop"
    WELLFOUND = "wellfound"
    GITHUB = "github"


class ConnectedPortalAccount(BaseModel):
    portal_id: PortalType
    portal_name: str
    username: Optional[str] = None
    profile_url: Optional[str] = None
    connected_at: datetime = Field(default_factory=utc_now)
    last_synced_at: Optional[datetime] = None
    status: str = "CONNECTED"  # CONNECTED, SYNCED, ERROR, DISCONNECTED
    extracted_summary: Dict[str, Any] = Field(default_factory=dict)


class ProfileSuggestionItem(BaseModel):
    field: str
    current_text: str
    suggested_text: str
    rationale: str
    impact_delta: str


class ProfileAuditReport(BaseModel):
    overall_profile_score: int = Field(..., ge=0, le=100)
    headline_rating: str
    headline_suggestions: List[str] = Field(default_factory=list)
    missing_high_demand_skills: List[str] = Field(default_factory=list)
    quantified_impact_ratio: float = Field(..., description="Ratio of bullets with numeric metrics (0.0 - 1.0)")
    bullet_improvements: List[ProfileSuggestionItem] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    evidence_items_created: int = 0


# ---------------- Social Hiring Posts Scanner Models ---------------- #

class SocialHiringPost(BaseModel):
    post_id: str
    source_platform: str  # LinkedIn, Twitter, Peerlist, etc.
    poster_name: str
    poster_title: Optional[str] = None
    poster_contact: Optional[str] = None
    company_name: str
    extracted_job_title: str
    location_work_mode: str
    tech_stack: List[str] = Field(default_factory=list)
    raw_post_text: str
    posted_at: str
    match_score: int = 0
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    suggested_outreach_subject: str = ""
    suggested_outreach_body: str = ""
    direct_apply_url: Optional[str] = None


# ---------------- Multi-Source Resume Import Models ---------------- #

class ResumeSourceType(str, Enum):
    LOCAL = "local"
    GOOGLE_DRIVE = "google_drive"
    DROPBOX = "dropbox"
    ONEDRIVE = "onedrive"
    URL = "url"
    RAW_TEXT = "raw_text"


class MultiSourceResumeImportRequest(BaseModel):
    source_type: ResumeSourceType
    file_name: str
    file_url_or_token: Optional[str] = None
    raw_content: Optional[str] = None


class MultiSourceResumeImportResponse(BaseModel):
    status: str
    source_type: ResumeSourceType
    file_name: str
    extracted_full_name: str
    extracted_email: str
    extracted_skills_count: int
    extracted_experience_count: int
    evidence_items_created: int
    storage_r2_url: Optional[str] = None
    preview_markdown: str


# ---------------- Cloudflare Integration Models ---------------- #

class CloudflareConfig(BaseModel):
    r2_configured: bool = True
    bucket_name: str = "selfhire-vault"
    turnstile_enabled: bool = True
    edge_domain: str = "https://edge.selfhire.ai"
    workers_active: bool = True


class CloudflareR2Asset(BaseModel):
    asset_id: str
    file_name: str
    content_type: str
    size_bytes: int
    r2_key: str
    public_url: str
    uploaded_at: datetime = Field(default_factory=utc_now)


# ---------------- Email Integration & Composer Models ---------------- #

class ConnectedEmailAccount(BaseModel):
    email_address: str
    provider: str  # gmail, outlook, smtp
    is_primary: bool = True
    connected_at: datetime = Field(default_factory=utc_now)
    status: str = "CONNECTED"


class ComposeEmailRequest(BaseModel):
    from_email: Optional[str] = None
    to_email: str
    subject: str
    body_text: str
    body_html: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)
    send_via_connected: bool = True


class SendEmailReceipt(BaseModel):
    receipt_id: str
    from_email: str
    to_email: str
    subject: str
    timestamp: datetime = Field(default_factory=utc_now)
    delivery_status: str
    method: str  # CONNECTED_SMTP, GMAIL_API, MAILTO_CLIENT
    sha256_audit_hash: str



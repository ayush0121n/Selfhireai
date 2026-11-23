# SelfHire.ai — Comprehensive Testing & Quality Assurance Plan

## 1. Testing Philosophy (Superpowers & Karpathy Directives)

In strict compliance with `/superpowers` (plan & test first) and `/karpathy-anti-slop`, every core feature in SelfHire.ai must be verified with automated regression tests before being marked complete:
- **No Mock Stubs in Production**: All tests run against concrete parsers, cryptographic hashers, and real headless browser forms.
- **Security-First Test Ordering**: Critical security gates (payload hashing, tenant isolation, approval expiry) are tested before feature code.
- **Zero Hallucination Tolerance**: Test suites assert that fictional skills injected into JDs are blocked by the tailoring engine.

---

## 2. Test Architecture & Directory Structure

```
tests/
├── unit/                        # Fast, isolated unit tests (< 50ms)
│   ├── test_payload_hasher.py   # Canonical JSON serialization & SHA-256 consistency
│   ├── test_fit_score.py        # 40% skills, 25% exp, 15% loc, 10% sal weighted formula
│   └── test_unsupported_claims.py # Evidence linkage blocker verification
├── security/                    # Security, auth & boundary tests
│   ├── test_approval_gate.py    # Single-use atomicity, TTL expiry, replay attack defense
│   ├── test_tenant_isolation.py # Supabase RLS verification (IDOR protection)
│   └── test_prompt_injection.py # Defense against malicious JDs containing instructions
├── fixtures/                    # Deterministic test data
│   ├── sample_profiles.json     # Synthetic candidate profiles with evidence IDs
│   ├── real_jds/                # Real-world JDs from Microsoft, Google, Startups
│   └── mock_html/               # Local multi-step HTML application forms
└── e2e/                         # Playwright end-to-end integration tests
    ├── test_mock_form_flow.py   # Complete Vertical Slice: Profile -> Resume -> Form -> Receipt
    └── test_pdf_ats_parse.py    # pdfplumber roundtrip text extraction verification
```

---

## 3. Critical Security & Integrity Test Specifications

### 3.1 Payload Hash Determinism & Anti-Tampering (`test_approval_gate.py`)
```python
def test_payload_hash_tamper_invalidates_approval():
    # 1. Given an approved application payload
    payload = {
        "application_id": "app_01",
        "url": "https://boards.greenhouse.io/techcorp/jobs/123",
        "fields": [{"name": "salary", "value": "120000"}],
        "resume_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
    approved_hash = compute_canonical_hash(payload)
    approval_token = issue_approval(payload_hash=approved_hash, ttl_minutes=30)
    
    # 2. When a field is maliciously or accidentally modified prior to submit
    tampered_payload = copy.deepcopy(payload)
    tampered_payload["fields"][0]["value"] = "180000"
    
    # 3. Then submit must fail and raise TamperedPayloadException
    with pytest.raises(TamperedPayloadException):
        execute_submission(tampered_payload, approval_token)
```

### 3.2 Single-Use Approval Lease & Anti-Replay (`test_approval_gate.py`)
- Verifies that once an approval token is consumed to click "Submit", a second call with the same token raises `ApprovalAlreadyConsumedException`.
- Verifies that approvals older than 30 minutes raise `ApprovalExpiredException`.

### 3.3 Zero-Hallucination Evidence Linkage (`test_unsupported_claims.py`)
- Inputs a JD demanding *"10 years of Kubernetes production experience"* against a candidate whose profile only verifies *"3 years of Docker"*.
- Asserts that the tailoring engine flags Kubernetes as `MISSING_REQUIREMENT` and **does not** inject it into the generated resume text.

### 3.4 ATS PDF Roundtrip Extraction Test (`test_pdf_ats_parse.py`)
- Generates a tailored PDF resume using the Python PDF generator.
- Extracts text using `pdfplumber` and `pypdf`.
- Verifies that:
  1. 100% of candidate contact info (email, phone, LinkedIn) is cleanly extracted.
  2. No text blocks or bullet points are merged or scrambled.
  3. All dates follow the ISO/Standard format (`YYYY-MM`).

---

## 4. End-to-End Acceptance Gate (Definition of Done)

To declare the MVP vertical slice ready for production, the following test suite must pass with 0 failures:
```bash
pytest tests/unit tests/security tests/e2e -v --durations=10
```
- Total test execution time < 45 seconds.
- 0 console errors or warnings left in output.
- All 3 failure demos pass: (1) Tampered payload rejected, (2) Duplicate submit blocked, (3) Timeout converts safely to `SUBMISSION_UNKNOWN`.

# SelfHire.ai — Non-Negotiable Rules & Safety Directives

These non-negotiable rules take precedence over any automated workflow, agent tool call, or prompt suggestion.

---

## 1. Truthfulness & Zero-Hallucination Policy
1. **Evidence Linkage**: Every factual claim, skill, metric, title, and date in a tailored resume must link directly to an existing `evidence_id` in the candidate's verified profile.
2. **Blocker for Unsupported Claims**: If an extracted JD keyword is absent from the candidate's verified history, the system is strictly prohibited from inventing or assuming experience. It must record the item as a `missing_skill`.
3. **No Guessing**: Missing facts (salary expectations, citizenship, notice period, legal history) must prompt the user. `UNKNOWN` is an acceptable and safe state.

---

## 2. Human-in-the-Loop Exact-Action Approval
1. **The Final Submit Boundary**: The AI agent is technically restricted from clicking the final "Submit Application" button or sending an outbound message without a cryptographically valid approval token.
2. **Cryptographic Payload Binding**: The approval token is bound to a canonical SHA-256 hash of the exact target URL, field mappings, resume version checksum, and attachments. If any value changes after approval, the token is instantly invalidated.
3. **Single-Use & TTL**: Approvals expire after 30 minutes and can only be consumed once. Double-submits are blocked atomically.

---

## 3. Platform Compliance & Anti-Ban Protection
1. **No Stealth Anti-Detection Tools**: The software does not use proxy rotation farms, canvas fingerprint spoofers, or stealth browser evasion kits.
2. **Visible Headed Sessions**: All portal logins and form interactions execute in a visible browser window where the user can see and take over at any time.
3. **2FA / CAPTCHA Protocol**: When a CAPTCHA, Cloudflare challenge, or 2FA prompt appears, the agent transitions to `CAPTCHA_REQUIRED` or `MFA_REQUIRED`, pauses, and notifies the user to solve it manually.
4. **LinkedIn Policy**: LinkedIn automation is restricted permanently to **Manual-Link and Extension-Assist readback**. Mass scraping or unattended bot submissions on LinkedIn are strictly forbidden.
5. **Rate Limiting**: Daily prepared applications are capped at 10/day; cold outreach drafts are capped at 5/day to maintain quality and avoid spam classification.

---

## 4. Credential & Secret Management
1. **Zero Credentials in Prompts**: Passwords and session cookies must never appear in AI prompts, system messages, or logs.
2. **Encrypted Storage**: Credentials stored for portal logins are encrypted using AES-256-GCM with a user-supplied passphrase.
3. **Immediate Revocation**: The user can wipe stored credentials or trigger the Global Kill Switch at any time.

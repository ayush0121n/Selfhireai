# Security Policy — SelfHire.ai

SelfHire.ai is built from the ground up on strict privacy-first and security-by-design principles:
- **No Hallucinated Claims**: All generated bullets must link to verifiable `evidence_id`s.
- **Exact-Action Approval Gate**: No external action (job application submission or email dispatch) is ever executed autonomously; every action is bound to a single-use SHA-256 payload hash with a 30-minute TTL.
- **Local Credential Isolation**: Portal credentials and session tokens reside locally in an AES-256-GCM encrypted vault (`credentials_vault`) on the candidate's machine and are never transmitted to LLM prompts or third-party servers.
- **Zero-Scrape Policy**: All job intelligence adheres to ethical public APIs or user-consented browser extensions without anti-bot circumvention.

---

## Supported Versions

| Version | Supported          | Security Patches |
| ------- | ------------------ | ---------------- |
| `main`  | :white_check_mark: | Immediate        |
| `< 1.0` | :x:                | Unsupported      |

---

## Reporting a Vulnerability

We take the security of SelfHire.ai and candidate privacy extremely seriously. If you discover a vulnerability, please do NOT file a public issue.

### Preferred Method: GitHub Private Vulnerability Reporting
1. Navigate to the repository's **Security** tab.
2. Under "Reporting a vulnerability", click **Report a vulnerability** or navigate to [Security Advisories](https://github.com/ayush0121n/Selfhireai/security/advisories/new).
3. Provide:
   - Detailed description of the potential vulnerability.
   - Steps to reproduce or proof-of-concept script.
   - Impact assessment (e.g., potential unauthorized credential access, approval gate bypass, or data exposure).
   - Any suggested mitigations.

### Email Security Contact
If you cannot use GitHub Security Advisories, contact the security team directly at:
- **Email**: `ayushnarkhede21@gmail.com`
- **PGP/GPG**: Encrypted communication preferred for critical vulnerabilities.

---

## SLA & Response Commitments

- **Acknowledgment**: Within **24 hours** of submission.
- **Assessment & Triage**: Within **48 hours**.
- **Fix & Patch Release**: Critical vulnerabilities patched within **7 days**.
- **Public Disclosure**: Coordinated disclosure after the patch is deployed and users are protected.

---

## Safe Harbor Policy

We consider security research conducted under this policy to be:
- Authorized under all applicable computer misuse laws.
- Exempt from legal action as long as the researcher acts in good faith, avoids privacy violations, avoids data destruction, and does not degrade production services.

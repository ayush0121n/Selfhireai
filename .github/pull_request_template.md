## Description
<!-- Provide a clear, concise summary of the changes and motivation. -->

## Security & Architectural Checklist
Please confirm that your changes strictly adhere to SelfHire.ai core directives:

- [ ] **Zero Hallucination**: No invented candidate metrics, years of experience, or unverified skills. Every tailored bullet point links to an immutable `evidence_id`.
- [ ] **Exact-Action Approval Gate**: External submissions or message dispatches are guarded by the SHA-256 canonical payload hash gate (no silent auto-submit).
- [ ] **No Secret Leaks**: No API keys, credentials, session tokens, or personal identifiers committed or logged.
- [ ] **Credential Isolation**: Any credential interactions must strictly utilize the AES-256-GCM local `credentials_vault`.
- [ ] **Dependency Audit**: No hallucinated or unverified dependencies added to `package.json` or `requirements.txt`.
- [ ] **Tests & Types**: All 70 unit tests pass (`python -m pytest tests/unit/`) and TypeScript type check passes (`npx tsc --noEmit`) with 0 errors.

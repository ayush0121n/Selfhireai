# AGENTS.md — SelfHire.ai Engineering Directives & Rules of Engagement

## 1. Prime Directives (Non-Negotiable)

1. **Plan & Test First (Superpowers)**:
   - Never write production code without existing tests or clear reproduction steps.
   - Verify every implementation milestone with automated test runs (`pytest`, `npm test`, `npm run build`) showing 0 errors.

2. **Karpathy Anti-Slop Principles**:
   - **No Hallucinated Packages**: Do not add unnecessary dependencies when existing libraries or standard APIs suffice.
   - **No Stubs or Placeholders**: Never leave `// TODO: implement later`, `pass`, or mock stubs in critical execution paths. Write complete, working code.
   - **No Silent Error Swallowing**: Never leave empty `except` or `catch` blocks. Always log, rethrow, or bubble actionable user feedback.
   - **Preserve Working Code**: Surgical edits only. Never rewrite unrelated working modules.

3. **Truthfulness & Evidence Linkage**:
   - The AI must never invent candidate experience, metrics, certifications, or technical tools.
   - Every bullet point generated in a tailored resume must link to an immutable `evidence_id`.
   - Unknown is a valid state; ask the candidate rather than guessing.

4. **Exact-Action Approval Gate**:
   - The agent is forbidden from auto-submitting any job application or sending any cold message.
   - Every external action requires human confirmation bound to a canonical **SHA-256 payload hash** with a 30-minute TTL.

5. **Security & Credential Isolation**:
   - Never inject portal passwords, session tokens, or personal identifiers into LLM prompts.
   - All credentials must reside locally in the AES-256-GCM encrypted keystore (`credentials_vault`).
   - Respect platform policies: Keep LinkedIn strictly in manual-link / extension-readback mode.

---

## 2. Visual & Aesthetic Standards (ui-ux-taste & impeccable)

- **Palette**: Warm Espresso & Terracotta Industrial Luxury.
  - Canvas: `#FEF5E7` (Warm Cream)
  - Typography: `#2D0E03` (Dark Espresso)
  - Accents: `#B34A0E` (Terracotta) & `#E67E22` (Carrot Orange)
  - Contours: `#6E250A` (Deep Rust)
  - Badges: `#FAD7A0` (Soft Peach)
  - Success: `#10B981` (Emerald)
- **Motion & 3D**: Subtle spring physics via `motion`; interactive 3D particle nodes via `@react-three/fiber` for Career Intelligence visualization.
- **Micro-Interactions**: Complete default, hover, active, focus-visible, and disabled states on every interactive component.

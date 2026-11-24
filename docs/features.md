# SelfHire.ai — Features & Capabilities Matrix

## 1. Feature Specifications

### 1.1 Profile & Evidence Vault
- **Master Resume Ingestion**: Upload PDF or DOCX; automated parsing into structured experience, skills, metrics, and education.
- **Evidence Verification UI**: Interactive checklist where candidate certifies parsed claims as verified truth.
- **Atomic Evidence Citations**: Each work achievement bullet is tagged with an immutable `evidence_id`.

### 1.2 ATS Resume Customization Studio & Reactive Resume
- **Dynamic Keyword Extraction**: Extracts technical skills, frameworks, domain requirements, and seniority phrases from JDs.
- **Side-by-Side Diff Viewer**: Highlights differences between Master Resume and Tailored Variant with one-click reject/accept controls.
- **Google XYZ Metric Formatter**: Transforms passive bullets into high-impact active achievements (`Accomplished [X], measured by [Y], by doing [Z]`).
- **Reactive Resume Interactive Paper Sheet**: A4/Letter visual previewer with 3 layout templates:
  - *Single-Column ATS*: High-density layout engineered for algorithmic parsing.
  - *Two-Column Executive*: Asymmetric layout with sticky side panel for skills, contacts, and education.
  - *Modern Accent*: High-contrast header card with optical section rules and tagged skill chips.
- **Interactive Sheet Controls**: Optical color palettes (Warm Terracotta, Espresso Luxe, Slate Navy, Emerald), fluid zoom controls (75%–130%), and browser-native print-to-PDF (`@media print` with zero margin bleed).
- **JSON Resume v1.0 Standard Interoperability**: Bi-directional conversion between SelfHire.ai profile/evidence structures and the official JSON Resume specification (`jsonresume.org`) used by Reactive Resume v4.
- **RenderCV & CareerOps Compiler**: Automated compilation into RenderCV YAML schema documents and quantitative impact auditing (CareerOps XYZ metric detection).
- **ATS Parse-Check**: Exported single-column PDFs are verified locally using `pdfplumber` to ensure zero scrambled text.

### 1.3 Multi-Portal Job Discovery & Manual Apply Gateway
- **Multi-Source Ingestion**: Aggregates live jobs and career postings from LinkedIn, Greenhouse, Lever, Workday, Naukri, Wellfound, Internshala, Cutshort, and direct company career pages.
- **Manual Apply Gateway**: In addition to automated agent preparation, candidates can apply directly on the source portal via direct deep-link or pre-filled manual application forms.
- **Portal & Company Registry**: Curated directory of global and Indian tech employers with verified career links and DOM selectors.

### 1.4 Privacy, Security & Credential Vault (DPDP 2023 / GDPR)
- **DPDP Act 2023 & GDPR Portability**: Instant one-click JSON export containing full candidate profile, evidence vault items, application receipts, and cryptographic verification hashes.
- **Right to Erasure**: Hard delete functionality that purges all personal data, session memory, and vault records.
- **Local AES-256-GCM Vault**: Portal credentials stored encrypted locally on the candidate's filesystem; never transmitted to AI prompts or third-party servers.
- **Zero-Scrape Policy**: Public compliance documentation outlining ethical API access and headed extension readback.

### 1.5 Smart Form Autofill Engine
- **Field Type Classification**: Standard text, email, phone, single-select, multi-select, checkbox, date-picker, drag-and-drop file upload.
- **Multi-Step Form Traversal**: Seamlessly navigates complex multi-page applications (Workday, Greenhouse).
- **Session Continuity**: Retains login cookies and storage state locally to prevent repeated logins.

### 1.4 Exact-Action Approval Gate
- **Canonical Payload Hashing**: SHA-256 hash calculated across all proposed field values, target URL, and resume version checksum.
- **Visual Review Package**: Clean summary of target company, role, filled fields, and resume preview with 30-minute TTL countdown.
- **One-Write Consumption**: Prevents race conditions or double-submits.

### 1.5 Recruiter Outreach CRM (Email & WhatsApp)
- **1,800+ TA Directory**: Pre-seeded database of talent acquisition leads across 383 top companies in India.
- **De-AI-ified Personalization**: Uses `humanizer` rules to generate warm, natural 1-to-1 notes citing common connections or company milestones.
- **WhatsApp Web Integration**: Formats pre-filled message and opens direct user-controlled chat (`https://wa.me/...`).

### 1.6 Three.js 3D Career Intelligence Core
- **Interactive Particle Core**: Real-time 3D visual sphere reflecting candidate market readiness and active matching channels.

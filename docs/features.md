# SelfHire.ai — Features & Capabilities Matrix

## 1. Feature Specifications

### 1.1 Profile & Evidence Vault
- **Master Resume Ingestion**: Upload PDF or DOCX; automated parsing into structured experience, skills, metrics, and education.
- **Evidence Verification UI**: Interactive checklist where candidate certifies parsed claims as verified truth.
- **Atomic Evidence Citations**: Each work achievement bullet is tagged with an immutable `evidence_id`.

### 1.2 ATS Resume Customization Studio
- **Dynamic Keyword Extraction**: Extracts technical skills, frameworks, domain requirements, and seniority phrases from JDs.
- **Side-by-Side Diff Viewer**: Highlights differences between Master Resume and Tailored Variant with one-click reject/accept controls.
- **Google XYZ Metric Formatter**: Transforms passive bullets into high-impact active achievements (`Accomplished [X], measured by [Y], by doing [Z]`).
- **ATS Parse-Check**: Exported single-column PDFs are verified locally using `pdfplumber` to ensure zero scrambled text.

### 1.3 Smart Form Autofill Engine
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

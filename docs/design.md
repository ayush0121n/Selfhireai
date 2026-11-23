# SelfHire.ai — Visual Design System & UX Specification

## 1. Design Philosophy: Anti-Slop Industrial Luxury
In accordance with `ui-ux-taste` and `impeccable`, SelfHire.ai eradicates generic AI web templates (no repetitive purple gradients, no 24px blurred drop-shadows, and no generic floating cards). Instead, it adopts a **Warm Espresso & Terracotta Industrial Luxury** theme—combining the physical warmth of premium editorial typography with the mathematical precision of high-density engineering consoles.

---

## 2. Color Tokens

| Token | Hex | Name | Application |
| :--- | :--- | :--- | :--- |
| `canvas.warm` | `#FEF5E7` | Warm Cream | Main background canvas, light mode body |
| `canvas.card` | `#FFFFFF` | Crisp White | Surface card backgrounds, elevated sheets |
| `text.primary` | `#2D0E03` | Dark Espresso | Primary headings, high-contrast dark mode canvas |
| `border.subtle` | `#6E250A` | Deep Rust Brown | Subtle borders (`1px solid rgba(110, 37, 10, 0.15)`), card contours |
| `accent.primary` | `#B34A0E` | Terracotta | Primary action buttons, active tab indicators |
| `accent.vibrant` | `#E67E22` | Carrot Orange | Match score dials (90%+), hover states, key highlights |
| `surface.badge` | `#FAD7A0` | Soft Peach | Tag pills, matched skill chips, subtle notification badges |
| `status.success` | `#10B981` | Emerald Green | Verified evidence badges, confirmed receipts, online status |

---

## 3. Typography & Spatial Hierarchy
- **Primary Sans**: Inter / Geist Sans for high legibility in dense form tables and UI controls.
- **Editorial Headings**: Newsreader / Serif accents on top-level dashboard titles to evoke editorial prestige.
- **Data & Telemetry**: JetBrains Mono for match scores, SHA-256 payload hashes, and JSON diffs.
- **Spatial Rhythm**: Strict 4px/8px modular rhythm (`p-2`, `p-4`, `p-6`, `p-8`).
- **Corner Radii**: Outer containers `16px`; inner interactive components `10px`; tag pills `9999px`.

---

## 4. Motion & Micro-Interactions (`motion` & `npx motion-ai`)
- **Drawer & Modal Transitions**: Smooth spring physics (`stiffness: 300, damping: 30`).
- **Interactive Button States**: Default, Hover (`translate-y(-1px)` with subtle warm glow), Active (`scale(0.98)`), Focus-Visible (`ring-2 ring-accent.primary`), Disabled (`opacity-50 cursor-not-allowed`).
- **Layout Persistence**: Skeletons match exact card geometry to prevent layout shifts.

---

## 5. Three.js Visual Enhancements (`@react-three/fiber`)
- **3D Career Intelligence Core**: A lightweight interactive particle sphere rendered in the dashboard hero representing live job market connections. Nodes illuminate in terracotta (`#B34A0E`) when new opportunities match candidate evidence.
- **Skill-Market Radar**: 3D interactive force-directed graph showing relationships between candidate skills and required industry keywords.

---

## 6. Higgsfield Video Storyboard Prompts

### Video 1 — Cinematic AI Career Agent Introduction (16:9, 15s)
- **Scene 1**: Camera dollies past an overwhelmed candidate facing multiple open browser tabs, PDFs, and rejection emails.
- **Scene 2**: Smooth transition into the warm cream SelfHire.ai dashboard. The 3D terracotta intelligence core activates in the center.
- **Scene 3**: High-fidelity job cards cascade into view; AI match percentages animate from 0% to 94%.
- **Scene 4**: Resume Studio appears. Keywords highlight in soft peach (`#FAD7A0`); sections reorder smoothly.
- **Scene 5**: Browser automation populates an employer form field-by-field. The exact approval dialog appears with a glowing SHA-256 badge.
- **Final Reveal**: Wide product showcase displaying Web, Chrome Extension, and Mobile companion together. Text: "SelfHire.ai — Represent Yourself with Superhuman Conviction."

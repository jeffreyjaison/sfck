# SFCK Plantation ERP — Demo Design Spec

**Date:** 2026-07-07
**Author:** Brainstorming session (Claude + user)
**Status:** Approved for implementation planning
**Source requirement:** `SFCK_ERP_Technical_Proposal final.pdf` (SkillNomads → State Farming Corporation of Kerala Ltd.)

---

## 1. Purpose & Audience

A **client-pitch demo** of the SFCK Plantation ERP system, deployed on **Vercel**, to show SFCK decision-makers what the real system will look and feel like. Priorities, in order:

1. **Visual credibility** — reads as a real, modern government ERP.
2. **Full coverage** — every one of the 23 requirements in the proposal's Compliance Matrix is represented by a visible, interactive screen.
3. **Data-backed realism** — real Postgres (Neon) persistence so actions (approvals, entries, payroll runs) actually stick.

This is a demo/prototype, **not** the production system. It represents requirements visually and interactively; it does not implement the full production security, offline sync, or SMS gateway. A subtle "Demo data" marker is present so no one mistakes it for live production.

## 2. Scope Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Audience | Client pitch to SFCK |
| Tier presentation | **One web app + role switcher** (field capture rendered in a phone frame) |
| Visual style | **Modern SaaS dashboard** |
| Data layer | **Neon Postgres** (was static; upgraded on user request) |
| ORM | **Drizzle ORM** + Neon serverless driver |
| Deployment | **Vercel + Neon integration** (env vars auto-synced) |
| Malayalam payslip | **Included** (headline differentiator) |

## 3. Architecture

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Drizzle ORM + Neon Postgres. Charts via a bundled library (Recharts) — no external runtime calls. Malayalam via a bundled Unicode font (`next/font`, e.g. Noto Sans Malayalam — downloaded at build time, no runtime external request).

**Layers:**
- **Data layer** — Drizzle schema + Neon Postgres. Pooled `DATABASE_URL` for app queries, unpooled `DATABASE_URL_UNPOOLED` for migrations/seed.
- **Role/session state** — React Context + `localStorage` holds the selected demo role and its jurisdiction. Server queries are scoped to that jurisdiction to *demonstrate* RBAC.
- **UI layer** — sidebar nav (role-filtered), persistent "access scope" banner, module screens, phone-frame simulation for field capture, print-friendly document/slip views.

**Environment files (already created):**
- `.env.local` — real Neon secrets (git-ignored).
- `.env.example` — committed template.
- `.gitignore` — excludes `.env.local`, `node_modules`, `.next`, `.vercel`.

## 4. Data Model (Drizzle schema, seeded)

Hierarchy mirroring SFCK's structure:

- **groups** — Group A (Chithalvetty, Kumaramkudy), Group B (Mullumala, Cheruppittakkavu)
- **estates** — 4 estates, each in a group
- **divisions** — per estate
- **collection_centres (CC)** — per division; area classes: Mature / Immature / Replanting
- **blocks** — per CC (class II/III/IV, standard kg targets + incentive rates, ~300–400 trees)
- **workers** — ~60 samples; category (Dependent/Casual/Permanent) × type (Tapper/General); unique permanent Check Roll Number; demographics; retirement age (default 58)

Operational tables:
- **attendance** — daily, with category duty windows + approval status
- **collections** — daily latex/scrap per worker/CC; weight slips; DRC values
- **payroll_runs** / **payroll_lines** — wage period 21–20, D4 wages, block-class incentives, PF/Weightage/Washing, editable recoveries
- **leave** — medical (14-day cap, ⅔ wage) and annual (1-per-20 accrual) records
- **stock** / **transfers** / **requisitions** — latex/scrap/ammonia/chemicals; estate→factory transfers; requisition approvals
- **replanting** — year-wise from 2014; census; yield; expenditure
- **audit_log** — actor, action, entity, timestamp (Data Integrity demonstration)

A **seed script** (run via unpooled connection) populates all of the above with realistic demo values so the app is full on first load.

## 5. Roles & Access (Requirement 1, 7)

Login screen with 5 role cards; top-bar dropdown switches instantly. Nav + visible data scope change per role. Out-of-jurisdiction data renders as a locked/restricted state.

| Role | Scope shown |
|---|---|
| Collection Centre / Tapping Supervisor | One assigned CC (phone-frame field capture) |
| Field Supervisor / Field Officer | Divisions under their control only |
| Assistant Manager (AM) | Whole estate; approval authority |
| Estate Manager (EM) | Their Group (A or B) |
| Managing Director / General Manager | Corporation-wide consolidation |

## 6. Modules → Requirement Coverage

| Screen | Requirements |
|---|---|
| Role Dashboard (scoped: CC → Estate → Group → Corporation) | Consolidation story |
| Employee Master & Check Roll — search/filter by gender/age/estate/category; unique Check Roll #; retirement alerts (2-month notice) | 2, 16, 17, 18 |
| Attendance — 6:15 tapper cut-off; AM approval 6:15–6:30; general-worker 8:00–5:00 + configurable category windows (Protection/Dependent/Casual, tapper-on-non-tapping-duty 6:00–2:00); EM excess-attendance → separate voucher; standard monthly basis | 3, 4, 5, 6 |
| Field Capture (phone frame) — latex/scrap entry; weight-slip (SMS + printable); locked-after-entry; AM correction approval | 20, 21 |
| Payroll / D4 Wage Engine — 4 blocks/tapper 4-day cycle; block class II/III/IV; wage period 21–20; CC-wise DRC; configurable working days; editable recoveries (EPF locked); PF/Weightage/Washing | 7, 8, 9, 12 |
| Malayalam Payment Slip — printable, Unicode Malayalam | 10 |
| Leave & Weightage — medical 14-day cap @⅔ wage; annual 1-per-20 accrual; permanent-only eligibility; holiday-within-medical-leave overlap auto-resolved (no double benefit) | 11 |
| Stock & Material — latex/scrap inventory + estate→factory transfer; ammonia/chemical-vs-latex monitoring; requisition + AM approval | 13, 14, 15 |
| Replanting — year-wise from 2014; census (surviving/decayed/vacant); yield from year 7; expenditure/ROI | 22 |
| Reports & MIS — consolidated production (estate/division/block/CC/group); YoY comparative w/ variance %; Documents generator for all 9 statutory docs | 19, 23 |
| Settings / Configuration — editable parameters without code: retirement age (default 58), approved working days/month, leave rules, DRC values, block-class targets & incentive rates | Proposal §11 (configurability) |

**Nine statutory documents** produced by the Documents generator: Daily Production Statement, Pocket Check Roll, Muster Chit, Payment Slip (Malayalam), Crop Book Parts 1 & 2, Production Performance of Estates, Final DRC Values, Daily Target & Achievement, Weight Slip.

## 7. Non-Functional Requirements — represented as UI cues

| NFR | How the demo represents it |
|---|---|
| Access Control | Role switcher + jurisdiction-scoped queries + locked out-of-scope data |
| Data Integrity | Locked-data badges + audit-trail panel; corrections only via approval workflow |
| Availability / offline-first | "Offline · Synced" indicator in the phone frame |
| Localisation | Malayalam payslip / worker-facing output; English operational UI |
| Security | Encryption/security note in settings; role-scoped data access |
| Scalability | Multi-estate / multi-CC data model |

These are visual affordances that *represent* the NFRs; they are not production implementations.

## 8. Honest Limitations of the Demo

- Not the production system; no real authentication, SMS gateway, or Android/offline sync engine.
- RBAC is *demonstrated* via query scoping keyed to a client-selected role, not enforced by a real auth server.
- Persistence is real (Neon), but data is demo seed data, clearly marked.

## 9. Deployment

- Next.js app on **Vercel**; **Neon integration** auto-provisions `DATABASE_URL` / `DATABASE_URL_UNPOOLED` / `POSTGRES_*`.
- Local dev: `vercel env pull .env.local` (or paste keys manually into the existing `.env.local`).
- Migrations + seed run against the unpooled/direct connection.

## 10. Out of Scope

- Real Android/handheld application and offline sync.
- Live SMS gateway integration.
- Production authentication, authorization server, and encryption-at-rest configuration.
- Commercials, AMC, and any non-demo deliverables from the proposal.

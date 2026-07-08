# Session log — 2026-07-08 (SFCK Plantation ERP)

A resume-able record of everything done in this session. Live app: **https://sfck-erp.vercel.app** · Repo: `github.com/jeffreyjaison/sfck` · Vercel project: `invenexs-projects/sfck-erp`.

---

## TL;DR — what shipped today

1. **Mobile navigation rebuilt** — replaced the bottom-nav with a hamburger → slide-in **side drawer** (full role nav + profile + role switcher). Verified on the real Safari engine (WebKit), all 5 roles.
2. **Role switcher fixed twice (TDD)** — (a) it was unreadable in the dark drawer (white text on transparent) → now opaque white bg + ink text; (b) switching a role did nothing visible → now closes the drawer and navigates to `/dashboard`.
3. **Landing page built** — a top-notch interactive marketing page at `/`; role-selection moved to `/login`. Reuses the tested dashboard widgets.
4. **Landing edited** — removed the "Design & tech spec" section; the **Features** section is now the emphasized centrepiece.
5. **SFCK pitch deck** — adapted the SkillNomads "HVIC" presentation to SFCK (21 slides) at `C:\Users\lenovo\Downloads\sfck-presentation\`, with real screenshots of the live app.
6. **Discovered: git-push auto-deploy is broken** — all deploys this session were manual (`vercel deploy --prod`). Needs a one-time browser step from the user (below).

---

## Key facts to know before resuming

- **Auto-deploy does NOT work.** The GitHub repo has **0 webhooks** — the Vercel GitHub App is not installed on `jeffreyjaison/sfck`. `vercel git connect` records the link but can't create the webhook. **Every change must be deployed manually:** `npx vercel@latest deploy --prod --yes` from the project root.
  - **Pending user action (browser-only):** go to https://github.com/apps/vercel → **Configure** → account **jeffreyjaison** → grant repo access to **sfck** → Save. Then ask Claude to verify (`vercel git connect` + check webhook + test push). Until done, keep deploying manually.
- **Local + prod share the same Neon database.** `.env.local` holds real credentials — never commit/print it (git-ignored). Reseeding the demo DB is authorized (regenerable).
- **Dev server** restarts get killed whenever a `next build` runs (`taskkill node`); the repeated "dev server failed" notifications are just old servers being killed — restart with `npm run dev`. Screenshots this session were captured against **prod** (no dev badge).
- **Deploy CLI is authenticated as `jeffreyjaison`**; explicit prod deploy is the reliable path.

---

## 1 · Mobile side navigation  (commit `650c6ff`)

**Problem reported:** "mobile side navigation still not working, not responsive, check all profiles" — after a prior fix that only passed in Chromium *emulation*.

**Root cause:** there was **no side navigation at all** on mobile — only a bottom bar. Prior verification checked layout overflow + static screenshots, never real-device interaction.

**Fix:** new `components/MobileNav.tsx` — a fixed top app bar with a **hamburger** that opens a left **slide-in drawer** containing the full role-scoped nav (`navFor`), user profile, and `RoleSwitcher`. Closes on backdrop tap / Esc / route change / role change. Removed `MobileTopBar.tsx` and `MobileBottomNav.tsx`. `Sidebar` stays `hidden lg:flex`. Wired in `app/(app)/layout.tsx`.

**Verified:** WebKit (Safari engine) at iPhone 13, touch taps, all 5 roles (cc→2 items … am→10) — drawer opens, links navigate, no overflow; confirmed on live prod.

## 2 · Role switcher — two TDD fixes  (commits `0f6cd56`, `3f90827`)

- **Contrast (RED→GREEN):** in the dark drawer the `<select>` computed to `color:white` on `background:transparent` → native option list unreadable. Fix: `RoleSwitcher` now self-contained `bg-white text-ink border-line` (readable in dark drawer *and* light banner). Test: computed-style assertion.
- **UX (RED→GREEN):** changing a role updated state but left the drawer open on the same page → felt broken. Fix: `RoleSwitcher.onChange` now `router.push('/dashboard')`; `MobileNav` closes the drawer on `session.role` change. Test: after switching, `drawerOpen===false && path==='/dashboard'`.

## 3 · Landing page + routing  (commit `e1df808`)

- `app/page.tsx` → new **public landing** (client component, static demo constants, no auth).
- Role-selection moved `app/page.tsx` → `app/login/page.tsx`; `(app)/layout.tsx` redirect changed `/` → `/login`.
- Reuses tested widgets: `ProductionPulse`, `ProductionChart`, `RadialGauge`, `Donut`, `StatCard`, `Timeline`, `categoryMix`, `ROLES`.
- Sections: sticky nav (anchors + "Launch live demo" → /login) · hero (live ProductionPulse) · stat band · 3 portals · 8 modules (M1–M8) · **interactive features** (real widgets) · RBAC role selector · 10 documents (Malayalam payslip) · final CTA + footer. Responsive, no overflow at 390px, `.animate-rise` reveals.

## 4 · Landing edit — remove spec, stress features  (commit `0f63f0d`)

- Removed the "Design & tech spec / Built like a product" section (+ its constants/imports).
- **Features** section is now the emphasized centrepiece: emerald-tinted band, "The interactive core" eyebrow, bold "Not screenshots — the live console" headline, 3 emphasis chips, and a `FeatureTag` pill on every widget.

## 5 · SFCK pitch deck  (standalone, NOT in this repo)

- **Location:** `C:\Users\lenovo\Downloads\sfck-presentation\` (`index.html` + `img/`). Source template: `C:\Users\lenovo\Downloads\hvic\index.html` (a SkillNomads deck for the "HVIC" project).
- Kept the SkillNomads template, design, and **all SkillNomads company details** ("by Skillnomads · KSUM-registered startup", footer). Changed **only** the project content + images to SFCK.
- **21 slides** (started 22; slide 21 "How it's built / architecture diagram" was removed on request). Ends on the Thank-you hero (21/21).
- Images: generated `logo-sfck.png` + a clean canopy `hero.jpg`; captured **12 live screenshots** from prod (landing, login, dashboard, employees, attendance, payroll (D4), leave, stock, replanting, reports, field, settings).
- Verified: 0 HVIC/hydrogen references, SkillNomads preserved, all slides render, no broken images.
- **Leftover:** unused `.arch`/`.anode`/`.aarrow` CSS rules remain in `<style>` (harmless dead CSS from the removed slide).

---

## Today's commits (all pushed to `main`; manually deployed)

```
0f63f0d  landing: remove design/tech spec; emphasize features
3f90827  mobile: role switch closes drawer + navigates to dashboard
e1df808  landing page + move role selection to /login
0f6cd56  mobile: role switcher readable in dark drawer
650c6ff  mobile: hamburger slide-in side drawer (replaces bottom nav)
```
Working tree clean; `main` == `origin/main`; prod == latest.

## Verification status

- `tsc --noEmit` clean · `eslint .` clean · **56/56 tests pass** · `next build` passes.
- Landing verified desktop + mobile (390px, no overflow); nav flow landing → /login → /dashboard; unauth → /login.
- Mobile drawer + role switcher verified on live prod (WebKit/iPhone): readable + functional.

---

## 6 · Security/integrity audit + Option A fixes  (commits `de1f74d`, `a63d099` — deployed to prod)

Full-build audit (pipeline green; 2 subagent code audits: UI + functional). Option A ("demo-credible integrity") fixed via TDD (21 new tests, 77 total):

- **Root cause found:** `sessionFromRequest` defaulted to `md` AND no client POST sent session params → every write ran at max privilege. Fixed: least-privilege default (`cc`), NaN scopeId → null, all 10 mutating fetches now use `withSession()` (new helper in `lib/client-fetch.ts`).
- **Settings POST** now gated (`canManageSettings`: am/md, new `lib/authz.ts`) + numeric validation — was fully unauthenticated and drives payroll math.
- **Payroll finalize**: gated (am/em/md); recomputes ALL wage figures server-side via new pure `lib/engine/payroll.ts` (GET shares it); only client input honored is "other recovery" (clamped ≥0); idempotent per estate/period (409); Draft→Finalized insert ordering (no finalized orphans — neon-http has no transactions).
- **Field capture**: worker + CC must be in caller's jurisdiction (403).
- **DRC averages** exclude null-DRC rows (`averageDrc` in `lib/engine/drc.ts`) — dashboard + payroll.
- **UI:** StatCard gained `note` prop (wrapping text); Replanting ROI card no longer a wrapped pill blob at 390px (verified local + prod screenshots, 0px overflow).
- Verified e2e on local AND live prod: 403s for unauth settings/finalize/out-of-scope capture; forged finalize lines ignored (checked Neon rows); double-finalize 409; test rows cleaned from shared DB.

**Audit findings NOT yet fixed (next round):** F4 finalized run's `estateId = estates[0]` misattributes multi-estate (md/em) runs; F5 gross ignores tapping days (spec decision needed: fixed-monthly vs per-day); Option B (a11y: drawer focus/inert, form labels) and Option C (API try/catch, res.ok checks, leave balance cap, token drift) from the audit report.

## Next / open items (resume here)

1. **[User, browser]** Install the Vercel GitHub App on `jeffreyjaison/sfck` to restore auto-deploy (steps above). Then Claude verifies with a test push.
2. **[Optional]** Deploy the SFCK pitch deck to Vercel (shareable link) and/or export to PDF/PPT.
3. **[Optional, tidy]** Strip the dead `.arch`/`.anode`/`.aarrow` CSS from the deck.
4. **[Minor]** Landing "Replanting ROI" style stat cards: long "spent · yield" text can wrap at 2-col — flagged earlier, not yet addressed.
5. **Reminder:** deploy manually after every change until #1 is done.

# SFCK Plantation ERP Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vercel-deployed, Neon-Postgres-backed Next.js demo of the SFCK Plantation ERP that visually and interactively covers all 23 requirements of the SkillNomads technical proposal for a client pitch.

**Architecture:** Next.js App Router (TypeScript) + Tailwind CSS for a modern SaaS dashboard. Drizzle ORM over Neon Postgres holds the full estate hierarchy and operational data, seeded with realistic demo values. A client-selected "role" drives jurisdiction-scoped Server Component queries to *demonstrate* RBAC. Pure calculation logic (DRC, D4 wages, block-class incentives, statutory deductions, leave) lives in a framework-free `lib/engine/` package built test-first with Vitest.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Drizzle ORM, `@neondatabase/serverless`, Vitest, Recharts, `next/font` (Noto Sans Malayalam), Vercel.

**Reference spec:** `docs/superpowers/specs/2026-07-07-sfck-erp-demo-design.md`

---

## File Structure

```
sfck-erp-demo/
├── .env.local / .env.example / .gitignore     (already created)
├── package.json, tsconfig.json, next.config.ts, vitest.config.ts
├── drizzle.config.ts
├── app/
│   ├── layout.tsx                  root layout (fonts, providers)
│   ├── globals.css                 tailwind + theme tokens
│   ├── page.tsx                    role-selection login
│   ├── (app)/layout.tsx            authed shell: sidebar + scope banner
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/employees/…           M1
│   ├── (app)/attendance/…          M2
│   ├── (app)/field/…               M3 (phone frame)
│   ├── (app)/payroll/…             M4 + Malayalam slip
│   ├── (app)/leave/…               M5
│   ├── (app)/stock/…               M6
│   ├── (app)/replanting/…          M7
│   ├── (app)/reports/…             M8 + documents
│   └── (app)/settings/page.tsx     configuration
├── components/                     shared UI (Sidebar, ScopeBanner, DataTable, StatCard, PhoneFrame, RoleSwitcher, PrintSheet)
├── lib/
│   ├── db/schema.ts                Drizzle tables
│   ├── db/client.ts                Neon connection
│   ├── db/queries.ts               role-scoped query helpers
│   ├── rbac.ts                     role definitions + scope resolution
│   ├── session.ts                  client role context
│   └── engine/                     PURE, TESTED calculation logic
│       ├── drc.ts                  DRC consolidation
│       ├── wages.ts                D4 + block-class + statutory
│       ├── leave.ts                medical/annual leave rules
│       └── attendance.ts           time-gate approval rules
├── scripts/seed.ts                 seed Neon with demo data
└── docs/superpowers/…              spec + this plan
```

**Responsibility boundaries:** `lib/engine/*` is pure TypeScript (no DB, no React) so it is unit-testable and holds every business rule. `lib/db/*` owns persistence and RBAC scoping. `app/` and `components/` are presentation only and call into `lib/`. This keeps the tested rules isolated from framework churn.

---

## Phase 0 — Project Scaffold

### Task 0.1: Initialize the Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

- [ ] **Step 1: Scaffold Next.js into the current directory**

Run (from `C:\Users\lenovo\OneDrive\Documents\SFCK`):
```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*" --use-npm --yes
```
Expected: project files created; `app/`, `package.json`, `tailwind` config present. If it warns the directory is non-empty (because of `.env*`, `docs/`), accept and continue.

- [ ] **Step 2: Initialize git and make the first commit**

Run:
```bash
git init
git add -A
git commit -m "chore: scaffold Next.js + Tailwind project"
```
Expected: initial commit created. `.env.local` is NOT committed (covered by `.gitignore`).

- [ ] **Step 3: Start the dev server to verify it runs**

Run: `npm run dev`
Expected: server starts on http://localhost:3000 with the default page. Stop it with Ctrl+C.

### Task 0.2: Install dependencies

- [ ] **Step 1: Install runtime + dev dependencies**

Run:
```bash
npm install drizzle-orm @neondatabase/serverless recharts
npm install -D drizzle-kit vitest @vitejs/plugin-react tsx dotenv @types/node
```
Expected: packages added to `package.json` with no peer-dependency errors.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add drizzle, neon, recharts, vitest deps"
```

### Task 0.3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Write the Vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Add test scripts to package.json**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add a smoke test and run it**

Create `lib/engine/smoke.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
describe('vitest', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```
Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 4: Delete the smoke test and commit config**

```bash
rm lib/engine/smoke.test.ts
git add vitest.config.ts package.json
git commit -m "chore: configure vitest"
```

---

## Phase 1 — Database Schema

### Task 1.1: Neon connection client

**Files:**
- Create: `lib/db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Write the Neon client**

```typescript
// lib/db/client.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set. Add it to .env.local');

const sql = neon(url);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 2: Write the Drizzle Kit config (uses the unpooled URL for migrations)**

```typescript
// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/client.ts drizzle.config.ts
git commit -m "feat: add neon db client and drizzle config"
```

### Task 1.2: Define the schema

**Files:**
- Create: `lib/db/schema.ts`

- [ ] **Step 1: Write enums and hierarchy tables**

```typescript
// lib/db/schema.ts
import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, date, pgEnum,
} from 'drizzle-orm/pg-core';

export const workerCategory = pgEnum('worker_category', ['Dependent', 'Casual', 'Permanent']);
export const workerType = pgEnum('worker_type', ['Tapper', 'General']);
export const areaClass = pgEnum('area_class', ['Mature', 'Immature', 'Replanting']);
export const blockClass = pgEnum('block_class', ['II', 'III', 'IV']);
export const approvalStatus = pgEnum('approval_status', ['Pending', 'Approved', 'Rejected', 'Locked']);

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // 'Group A' | 'Group B'
});

export const estates = pgTable('estates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  groupId: integer('group_id').references(() => groups.id).notNull(),
});

export const divisions = pgTable('divisions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
});

export const collectionCentres = pgTable('collection_centres', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  divisionId: integer('division_id').references(() => divisions.id).notNull(),
  area: areaClass('area').notNull().default('Mature'),
});

export const blocks = pgTable('blocks', {
  id: serial('id').primaryKey(),
  code: text('code').notNull(),
  ccId: integer('cc_id').references(() => collectionCentres.id).notNull(),
  blockClass: blockClass('block_class').notNull(),
  standardKg: numeric('standard_kg').notNull(),     // class target
  incentiveRate: numeric('incentive_rate').notNull(),
  treeCount: integer('tree_count').notNull().default(350),
});
```

- [ ] **Step 2: Add workers and operational tables (append to same file)**

```typescript
export const workers = pgTable('workers', {
  id: serial('id').primaryKey(),
  checkRoll: text('check_roll').notNull().unique(), // permanent, non-reusable
  name: text('name').notNull(),
  category: workerCategory('category').notNull(),
  type: workerType('type').notNull(),
  gender: text('gender').notNull(),
  dob: date('dob').notNull(),
  dateOfJoining: date('date_of_joining').notNull(),
  mobile: text('mobile'),
  email: text('email'),
  address: text('address'),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  ccId: integer('cc_id').references(() => collectionCentres.id),
  active: boolean('active').notNull().default(true),
  retired: boolean('retired').notNull().default(false),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  day: date('day').notNull(),
  markedAt: text('marked_at').notNull(), // 'HH:MM'
  isExcess: boolean('is_excess').notNull().default(false),
  status: approvalStatus('status').notNull().default('Pending'),
});

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  ccId: integer('cc_id').references(() => collectionCentres.id).notNull(),
  day: date('day').notNull(),
  latexKg: numeric('latex_kg').notNull().default('0'),
  scrapKg: numeric('scrap_kg').notNull().default('0'),
  drc: numeric('drc'),                 // uniform per CC per period
  locked: boolean('locked').notNull().default(true),
  slipSentSms: boolean('slip_sent_sms').notNull().default(true),
});

export const payrollRuns = pgTable('payroll_runs', {
  id: serial('id').primaryKey(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  periodStart: date('period_start').notNull(), // 21st
  periodEnd: date('period_end').notNull(),     // 20th
  workingDays: integer('working_days').notNull().default(26),
  status: text('status').notNull().default('Draft'),
});

export const payrollLines = pgTable('payroll_lines', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').references(() => payrollRuns.id).notNull(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  grossWage: numeric('gross_wage').notNull(),
  incentive: numeric('incentive').notNull().default('0'),
  weightage: numeric('weightage').notNull().default('0'),
  washing: numeric('washing').notNull().default('0'),
  pf: numeric('pf').notNull().default('0'),
  otherRecovery: numeric('other_recovery').notNull().default('0'),
  netPay: numeric('net_pay').notNull(),
});

export const leaveRecords = pgTable('leave_records', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').references(() => workers.id).notNull(),
  kind: text('kind').notNull(),        // 'Medical' | 'Annual'
  days: integer('days').notNull(),
  year: integer('year').notNull(),
});

export const stockItems = pgTable('stock_items', {
  id: serial('id').primaryKey(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  name: text('name').notNull(),        // Latex, Scrap, Ammonia, ...
  unit: text('unit').notNull(),
  balance: numeric('balance').notNull().default('0'),
});

export const requisitions = pgTable('requisitions', {
  id: serial('id').primaryKey(),
  ccId: integer('cc_id').references(() => collectionCentres.id).notNull(),
  item: text('item').notNull(),
  qty: integer('qty').notNull(),
  status: approvalStatus('status').notNull().default('Pending'),
});

export const replanting = pgTable('replanting', {
  id: serial('id').primaryKey(),
  estateId: integer('estate_id').references(() => estates.id).notNull(),
  blockCode: text('block_code').notNull(),
  plantingYear: integer('planting_year').notNull(), // >= 2014
  areaHa: numeric('area_ha').notNull(),
  surviving: integer('surviving').notNull().default(0),
  decayed: integer('decayed').notNull().default(0),
  vacant: integer('vacant').notNull().default(0),
  expenditure: numeric('expenditure').notNull().default('0'),
  yieldKg: numeric('yield_kg').notNull().default('0'),
});

export const auditLog = pgTable('audit_log', {
  id: serial('id').primaryKey(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  at: timestamp('at').notNull().defaultNow(),
});
```

- [ ] **Step 3: Add the settings (configuration) table**

```typescript
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),   // 'retirement_age', 'working_days', ...
  value: text('value').notNull(),
  label: text('label').notNull(),
});
```

- [ ] **Step 4: Add drizzle scripts to package.json**

In `"scripts"`, add:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:seed": "tsx scripts/seed.ts"
```

- [ ] **Step 5: Push the schema to Neon**

Ensure `.env.local` has real Neon keys, then run:
```bash
npm run db:push
```
Expected: Drizzle reports tables created on Neon. If it errors with "DATABASE_URL is not set", the keys are missing.

- [ ] **Step 6: Commit**

```bash
git add lib/db/schema.ts package.json
git commit -m "feat: define drizzle schema for full estate hierarchy"
```

---

## Phase 2 — Seed Data

### Task 2.1: Seed script

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Write the seed script**

Write `scripts/seed.ts` that (a) loads env via `dotenv/config`, (b) truncates tables in FK-safe order, (c) inserts the fixed hierarchy and generated workers/records. Use this exact structure:

```typescript
// scripts/seed.ts
import 'dotenv/config';
import { db } from '../lib/db/client';
import * as s from '../lib/db/schema';

async function main() {
  // 1. Groups & estates (fixed, from the proposal)
  const [gA] = await db.insert(s.groups).values({ name: 'Group A' }).returning();
  const [gB] = await db.insert(s.groups).values({ name: 'Group B' }).returning();
  const estateRows = await db.insert(s.estates).values([
    { name: 'Chithalvetty', groupId: gA.id },
    { name: 'Kumaramkudy', groupId: gA.id },
    { name: 'Mullumala', groupId: gB.id },
    { name: 'Cheruppittakkavu', groupId: gB.id },
  ]).returning();

  // 2. For each estate: 2 divisions, each with 2 CCs, each with 3 blocks
  const classSpec = {
    II:  { standardKg: '18', incentiveRate: '12' },
    III: { standardKg: '15', incentiveRate: '10' },
    IV:  { standardKg: '12', incentiveRate: '8' },
  } as const;

  let checkSeq = 1000;
  for (const est of estateRows) {
    for (let d = 1; d <= 2; d++) {
      const [div] = await db.insert(s.divisions)
        .values({ name: `${est.name} Division ${d}`, estateId: est.id }).returning();
      for (let c = 1; c <= 2; c++) {
        const [cc] = await db.insert(s.collectionCentres)
          .values({ name: `CC ${est.name.slice(0,3)}-${d}${c}`, divisionId: div.id, area: 'Mature' })
          .returning();
        for (const bc of ['II', 'III', 'IV'] as const) {
          await db.insert(s.blocks).values({
            code: `${cc.name}-${bc}`, ccId: cc.id, blockClass: bc,
            standardKg: classSpec[bc].standardKg, incentiveRate: classSpec[bc].incentiveRate,
            treeCount: 350,
          });
        }
        // 4 workers per CC across categories/types
        const people = [
          { category: 'Permanent', type: 'Tapper' },
          { category: 'Casual', type: 'Tapper' },
          { category: 'Dependent', type: 'General' },
          { category: 'Permanent', type: 'General' },
        ] as const;
        for (const p of people) {
          checkSeq += 1;
          await db.insert(s.workers).values({
            checkRoll: `SFCK-${checkSeq}`,
            name: `Worker ${checkSeq}`,
            category: p.category, type: p.type,
            gender: checkSeq % 2 ? 'Male' : 'Female',
            dob: '1975-05-10', dateOfJoining: '2010-06-01',
            mobile: `98${checkSeq}00`, email: null, address: `${est.name}`,
            estateId: est.id, ccId: cc.id,
          });
        }
      }
    }
    // Stock items per estate
    await db.insert(s.stockItems).values([
      { estateId: est.id, name: 'Latex', unit: 'kg', balance: '4200' },
      { estateId: est.id, name: 'Scrap', unit: 'kg', balance: '1100' },
      { estateId: est.id, name: 'Ammonia', unit: 'L', balance: '260' },
    ]);
    // Replanting history (2014 onward)
    await db.insert(s.replanting).values([
      { estateId: est.id, blockCode: `${est.name}-RP14`, plantingYear: 2014, areaHa: '5.0',
        surviving: 1600, decayed: 80, vacant: 20, expenditure: '850000', yieldKg: '3200' },
      { estateId: est.id, blockCode: `${est.name}-RP18`, plantingYear: 2018, areaHa: '4.0',
        surviving: 1400, decayed: 60, vacant: 40, expenditure: '620000', yieldKg: '0' },
    ]);
  }

  // 3. Settings (configurable parameters)
  await db.insert(s.settings).values([
    { key: 'retirement_age', value: '58', label: 'Retirement Age' },
    { key: 'working_days', value: '26', label: 'Approved Working Days / Month' },
    { key: 'medical_leave_cap', value: '14', label: 'Medical Leave Cap (days/yr)' },
    { key: 'pf_percent', value: '12', label: 'PF Percentage' },
  ]);

  console.log('Seed complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the seed**

Run: `npm run db:seed`
Expected: "Seed complete." and rows present in Neon (verify via Neon console or `npm run db:studio` if added).

- [ ] **Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: seed Neon with demo estate hierarchy and data"
```

---

## Phase 3 — Calculation Engines (TDD)

> These are the business rules the proposal is most specific about. Build each test-first.

### Task 3.1: Block-class incentive & D4 wage engine

**Files:**
- Create: `lib/engine/wages.ts`, `lib/engine/wages.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/engine/wages.test.ts
import { describe, it, expect } from 'vitest';
import { blockIncentive, statutoryDeductions, netPay } from './wages';

describe('blockIncentive', () => {
  it('pays incentive only on kg above the block-class standard target', () => {
    // class III standard 15kg, rate 10/kg; produced 18kg -> 3kg over -> 30
    expect(blockIncentive({ producedKg: 18, standardKg: 15, incentiveRate: 10 })).toBe(30);
  });
  it('returns 0 when production is at or below the standard target', () => {
    expect(blockIncentive({ producedKg: 12, standardKg: 15, incentiveRate: 10 })).toBe(0);
  });
});

describe('statutoryDeductions', () => {
  it('applies 12% PF for Permanent tappers', () => {
    expect(statutoryDeductions({ category: 'Permanent', gross: 1000, pfPercent: 12 }).pf).toBe(120);
  });
  it('applies PF for Casual too', () => {
    expect(statutoryDeductions({ category: 'Casual', gross: 1000, pfPercent: 12 }).pf).toBe(120);
  });
  it('excludes PF for Dependent workers', () => {
    expect(statutoryDeductions({ category: 'Dependent', gross: 1000, pfPercent: 12 }).pf).toBe(0);
  });
});

describe('netPay', () => {
  it('adds earnings then subtracts recoveries', () => {
    // gross 1000 + incentive 30 + weightage 50 + washing 20 - pf 120 - other 10 = 970
    expect(netPay({ gross: 1000, incentive: 30, weightage: 50, washing: 20, pf: 120, other: 10 })).toBe(970);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `blockIncentive`/`statutoryDeductions`/`netPay` not defined.

- [ ] **Step 3: Implement `lib/engine/wages.ts`**

```typescript
// lib/engine/wages.ts
export type Category = 'Dependent' | 'Casual' | 'Permanent';

export function blockIncentive(
  { producedKg, standardKg, incentiveRate }: { producedKg: number; standardKg: number; incentiveRate: number },
): number {
  const over = Math.max(0, producedKg - standardKg);
  return over * incentiveRate;
}

export function statutoryDeductions(
  { category, gross, pfPercent }: { category: Category; gross: number; pfPercent: number },
): { pf: number } {
  const pfEligible = category === 'Permanent' || category === 'Casual';
  return { pf: pfEligible ? (gross * pfPercent) / 100 : 0 };
}

// Weightage & Washing Allowance apply to Permanent only.
export function permanentAllowances(
  { category, weightage, washing }: { category: Category; weightage: number; washing: number },
): { weightage: number; washing: number } {
  return category === 'Permanent' ? { weightage, washing } : { weightage: 0, washing: 0 };
}

export function netPay(
  { gross, incentive, weightage, washing, pf, other }:
  { gross: number; incentive: number; weightage: number; washing: number; pf: number; other: number },
): number {
  return gross + incentive + weightage + washing - pf - other;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all wage tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/engine/wages.ts lib/engine/wages.test.ts
git commit -m "feat: block-class incentive + statutory deduction engine (TDD)"
```

### Task 3.2: DRC consolidation engine

**Files:**
- Create: `lib/engine/drc.ts`, `lib/engine/drc.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/engine/drc.test.ts
import { describe, it, expect } from 'vitest';
import { consolidateDrc, dryRubberKg } from './drc';

describe('consolidateDrc', () => {
  it('averages CC samples with factory/tanker samples into one uniform CC DRC', () => {
    // ccSamples avg 0.40, factorySamples avg 0.44 -> mean 0.42
    expect(consolidateDrc({ ccSamples: [0.38, 0.42], factorySamples: [0.44] })).toBeCloseTo(0.42, 5);
  });
});

describe('dryRubberKg', () => {
  it('multiplies wet latex kg by the uniform CC DRC', () => {
    expect(dryRubberKg({ latexKg: 100, drc: 0.42 })).toBeCloseTo(42, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` → FAIL (`consolidateDrc` not defined).

- [ ] **Step 3: Implement `lib/engine/drc.ts`**

```typescript
// lib/engine/drc.ts
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Uniform DRC for all workers attached to a CC: mean of CC-sample average and factory-sample average.
export function consolidateDrc(
  { ccSamples, factorySamples }: { ccSamples: number[]; factorySamples: number[] },
): number {
  return (avg(ccSamples) + avg(factorySamples)) / 2;
}

export function dryRubberKg({ latexKg, drc }: { latexKg: number; drc: number }): number {
  return latexKg * drc;
}
```

- [ ] **Step 4: Run tests → PASS. Commit**

```bash
npm test
git add lib/engine/drc.ts lib/engine/drc.test.ts
git commit -m "feat: DRC consolidation engine (TDD)"
```

### Task 3.3: Leave rules engine

**Files:**
- Create: `lib/engine/leave.ts`, `lib/engine/leave.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/engine/leave.test.ts
import { describe, it, expect } from 'vitest';
import { medicalLeavePayable, annualLeaveAccrued, isLeaveEligible } from './leave';

describe('medicalLeavePayable', () => {
  it('caps medical leave at 14 days/year and pays two-thirds daily wage', () => {
    // request 5 days, 0 already taken, dailyWage 300 -> 5 * 200 = 1000
    expect(medicalLeavePayable({ requestedDays: 5, takenThisYear: 0, dailyWage: 300 }))
      .toEqual({ paidDays: 5, amount: 1000 });
  });
  it('does not pay beyond the 14-day annual cap', () => {
    // 12 already taken, request 5 -> only 2 payable
    expect(medicalLeavePayable({ requestedDays: 5, takenThisYear: 12, dailyWage: 300 }))
      .toEqual({ paidDays: 2, amount: 400 });
  });
});

describe('annualLeaveAccrued', () => {
  it('accrues one day per 20 working days', () => {
    expect(annualLeaveAccrued(60)).toBe(3);
    expect(annualLeaveAccrued(59)).toBe(2);
  });
});

describe('isLeaveEligible', () => {
  it('restricts leave eligibility to Permanent employees', () => {
    expect(isLeaveEligible('Permanent')).toBe(true);
    expect(isLeaveEligible('Casual')).toBe(false);
    expect(isLeaveEligible('Dependent')).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `lib/engine/leave.ts`**

```typescript
// lib/engine/leave.ts
import type { Category } from './wages';

const MEDICAL_CAP = 14;

export function medicalLeavePayable(
  { requestedDays, takenThisYear, dailyWage }:
  { requestedDays: number; takenThisYear: number; dailyWage: number },
): { paidDays: number; amount: number } {
  const remaining = Math.max(0, MEDICAL_CAP - takenThisYear);
  const paidDays = Math.min(requestedDays, remaining);
  return { paidDays, amount: paidDays * ((dailyWage * 2) / 3) };
}

export function annualLeaveAccrued(workingDays: number): number {
  return Math.floor(workingDays / 20);
}

export function isLeaveEligible(category: Category): boolean {
  return category === 'Permanent';
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
npm test
git add lib/engine/leave.ts lib/engine/leave.test.ts
git commit -m "feat: leave rules engine (TDD)"
```

### Task 3.4: Attendance time-gate engine

**Files:**
- Create: `lib/engine/attendance.ts`, `lib/engine/attendance.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/engine/attendance.test.ts
import { describe, it, expect } from 'vitest';
import { tapperAttendanceOutcome } from './attendance';

describe('tapperAttendanceOutcome', () => {
  it('auto-approves a tapper marked at or before 6:15', () => {
    expect(tapperAttendanceOutcome('06:10')).toBe('Approved');
  });
  it('requires AM approval between 6:15 and 6:30', () => {
    expect(tapperAttendanceOutcome('06:25')).toBe('Pending');
  });
  it('rejects a tapper after 6:30', () => {
    expect(tapperAttendanceOutcome('06:45')).toBe('Rejected');
  });
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `lib/engine/attendance.ts`**

```typescript
// lib/engine/attendance.ts
export type AttendanceOutcome = 'Approved' | 'Pending' | 'Rejected';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Tapper cut-off 6:15; AM approval window 6:15–6:30; restricted thereafter.
export function tapperAttendanceOutcome(markedAt: string): AttendanceOutcome {
  const t = toMinutes(markedAt);
  if (t <= toMinutes('06:15')) return 'Approved';
  if (t <= toMinutes('06:30')) return 'Pending';
  return 'Rejected';
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
npm test
git add lib/engine/attendance.ts lib/engine/attendance.test.ts
git commit -m "feat: attendance time-gate engine (TDD)"
```

---

## Phase 4 — RBAC & App Shell

### Task 4.1: Role definitions and scope resolution

**Files:**
- Create: `lib/rbac.ts`, `lib/rbac.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/rbac.test.ts
import { describe, it, expect } from 'vitest';
import { ROLES, navFor, canAccessEstate } from './rbac';

describe('rbac', () => {
  it('defines all five roles', () => {
    expect(ROLES.map(r => r.id)).toEqual(['cc', 'fo', 'am', 'em', 'md']);
  });
  it('MD can access every estate', () => {
    expect(canAccessEstate({ role: 'md', scopeId: null }, 3)).toBe(true);
  });
  it('AM can access only their own estate', () => {
    expect(canAccessEstate({ role: 'am', scopeId: 1 }, 1)).toBe(true);
    expect(canAccessEstate({ role: 'am', scopeId: 1 }, 2)).toBe(false);
  });
  it('CC role sees only field + dashboard nav', () => {
    expect(navFor('cc').map(n => n.href)).toEqual(['/dashboard', '/field']);
  });
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `lib/rbac.ts`**

```typescript
// lib/rbac.ts
export type RoleId = 'cc' | 'fo' | 'am' | 'em' | 'md';

export interface Session { role: RoleId; scopeId: number | null; }

export interface NavItem { href: string; label: string; }

const ALL_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/field', label: 'Field Capture' },
  { href: '/employees', label: 'Employees' },
  { href: '/attendance', label: 'Attendance' },
  { href: '/payroll', label: 'Payroll' },
  { href: '/leave', label: 'Leave' },
  { href: '/stock', label: 'Stock' },
  { href: '/replanting', label: 'Replanting' },
  { href: '/reports', label: 'Reports & MIS' },
  { href: '/settings', label: 'Settings' },
];

export const ROLES: { id: RoleId; label: string; scope: string }[] = [
  { id: 'cc', label: 'Collection Centre Worker', scope: 'Assigned CC' },
  { id: 'fo', label: 'Field Officer', scope: 'Their Divisions' },
  { id: 'am', label: 'Assistant Manager', scope: 'Whole Estate' },
  { id: 'em', label: 'Estate Manager', scope: 'Their Group' },
  { id: 'md', label: 'Managing Director / GM', scope: 'Corporation-wide' },
];

const NAV_BY_ROLE: Record<RoleId, string[]> = {
  cc: ['/dashboard', '/field'],
  fo: ['/dashboard', '/employees', '/attendance', '/reports'],
  am: ['/dashboard', '/employees', '/attendance', '/field', '/payroll', '/leave', '/stock', '/replanting', '/reports', '/settings'],
  em: ['/dashboard', '/employees', '/attendance', '/payroll', '/leave', '/stock', '/replanting', '/reports'],
  md: ['/dashboard', '/employees', '/attendance', '/payroll', '/leave', '/stock', '/replanting', '/reports'],
};

export function navFor(role: RoleId): NavItem[] {
  const allowed = new Set(NAV_BY_ROLE[role]);
  return ALL_NAV.filter(n => allowed.has(n.href));
}

export function canAccessEstate(session: Session, estateId: number): boolean {
  if (session.role === 'md') return true;
  return session.scopeId === estateId; // demo scoping (estate-level) for am/fo/cc; em resolved via group in queries
}
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
npm test
git add lib/rbac.ts lib/rbac.test.ts
git commit -m "feat: RBAC role + scope resolution (TDD)"
```

### Task 4.2: Client role session context

**Files:**
- Create: `lib/session.ts`, `components/RoleProvider.tsx`

- [ ] **Step 1: Implement the client session context**

```tsx
// components/RoleProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { RoleId, Session } from '@/lib/rbac';

const KEY = 'sfck-session';
const Ctx = createContext<{ session: Session | null; setSession: (s: Session) => void }>({
  session: null, setSession: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setSessionState(JSON.parse(raw));
  }, []);
  const setSession = (s: Session) => { localStorage.setItem(KEY, JSON.stringify(s)); setSessionState(s); };
  return <Ctx.Provider value={{ session, setSession }}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
export type { RoleId };
```

- [ ] **Step 2: Commit**

```bash
git add lib/session.ts components/RoleProvider.tsx
git commit -m "feat: client role session context"
```

### Task 4.3: Root layout, fonts, theme, login page

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Create: `app/page.tsx` (role selection)

- [ ] **Step 1: Configure fonts (incl. Malayalam) and providers in `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Noto_Sans_Malayalam } from 'next/font/google';
import { RoleProvider } from '@/components/RoleProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const malayalam = Noto_Sans_Malayalam({ subsets: ['malayalam'], variable: '--font-ml', weight: ['400', '600'] });

export const metadata: Metadata = { title: 'SFCK Plantation ERP', description: 'Demo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${malayalam.variable} antialiased bg-slate-50 text-slate-800`}>
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Build the role-selection login at `app/page.tsx`**

```tsx
// app/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

// Demo scope: which estate id each non-MD role is pinned to.
const DEMO_SCOPE: Record<string, number | null> = { cc: 1, fo: 1, am: 1, em: 1, md: null };

export default function Login() {
  const router = useRouter();
  const { setSession } = useSession();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-emerald-700">SFCK Plantation ERP</h1>
        <p className="text-slate-500">Select a role to explore the system (demo data)</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
        {ROLES.map(r => (
          <button key={r.id}
            onClick={() => { setSession({ role: r.id, scopeId: DEMO_SCOPE[r.id] }); router.push('/dashboard'); }}
            className="rounded-xl border bg-white p-5 text-left shadow-sm hover:shadow-md hover:border-emerald-400 transition">
            <div className="font-semibold">{r.label}</div>
            <div className="text-sm text-slate-500">{r.scope}</div>
          </button>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev`, open http://localhost:3000. Expected: five role cards; clicking one routes to `/dashboard` (404 until Task 4.4 — that's fine).

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx app/globals.css
git commit -m "feat: fonts, theme, and role-selection login"
```

### Task 4.4: Authed shell — sidebar, scope banner, role switcher

**Files:**
- Create: `app/(app)/layout.tsx`, `components/Sidebar.tsx`, `components/ScopeBanner.tsx`, `components/RoleSwitcher.tsx`

- [ ] **Step 1: Build the shell layout**

```tsx
// app/(app)/layout.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/components/RoleProvider';
import { Sidebar } from '@/components/Sidebar';
import { ScopeBanner } from '@/components/ScopeBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const router = useRouter();
  useEffect(() => { if (session === null) router.replace('/'); }, [session, router]);
  if (!session) return null;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <ScopeBanner />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build `Sidebar.tsx` (uses `navFor`), `ScopeBanner.tsx` (shows role + scope + "Demo data" chip + RoleSwitcher), `RoleSwitcher.tsx` (dropdown calling `setSession`).**

`components/Sidebar.tsx`:
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navFor } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

export function Sidebar() {
  const { session } = useSession();
  const path = usePathname();
  if (!session) return null;
  return (
    <aside className="w-60 shrink-0 border-r bg-white p-4">
      <div className="mb-6 font-bold text-emerald-700">SFCK ERP</div>
      <nav className="space-y-1">
        {navFor(session.role).map(n => (
          <Link key={n.href} href={n.href}
            className={`block rounded-lg px-3 py-2 text-sm ${path === n.href ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

`components/RoleSwitcher.tsx`:
```tsx
'use client';
import { ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';

const DEMO_SCOPE: Record<string, number | null> = { cc: 1, fo: 1, am: 1, em: 1, md: null };

export function RoleSwitcher() {
  const { session, setSession } = useSession();
  if (!session) return null;
  return (
    <select value={session.role}
      onChange={e => setSession({ role: e.target.value as any, scopeId: DEMO_SCOPE[e.target.value] })}
      className="rounded-lg border px-2 py-1 text-sm">
      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  );
}
```

`components/ScopeBanner.tsx`:
```tsx
'use client';
import { ROLES } from '@/lib/rbac';
import { useSession } from '@/components/RoleProvider';
import { RoleSwitcher } from '@/components/RoleSwitcher';

export function ScopeBanner() {
  const { session } = useSession();
  if (!session) return null;
  const role = ROLES.find(r => r.id === session.role)!;
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="text-sm">
        <span className="font-medium text-slate-700">{role.label}</span>
        <span className="text-slate-400"> · {role.scope}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Demo data</span>
        <RoleSwitcher />
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Verify** — role card → shell renders with sidebar filtered by role; switching role changes nav live.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/layout.tsx" components/Sidebar.tsx components/ScopeBanner.tsx components/RoleSwitcher.tsx
git commit -m "feat: authed shell with role-scoped nav and switcher"
```

### Task 4.5: Role-scoped query helpers + shared UI primitives

**Files:**
- Create: `lib/db/queries.ts`, `components/DataTable.tsx`, `components/StatCard.tsx`

- [ ] **Step 1: Implement scoped queries in `lib/db/queries.ts`**

Provide functions that accept a `Session` and return only in-jurisdiction rows. Example:
```typescript
// lib/db/queries.ts
import { db } from './client';
import { estates, groups, workers } from './schema';
import { eq, inArray } from 'drizzle-orm';
import type { Session } from '@/lib/rbac';

export async function estatesForSession(session: Session) {
  if (session.role === 'md') return db.select().from(estates);
  if (session.role === 'em' && session.scopeId) {
    // em scope = group of their pinned estate
    const [est] = await db.select().from(estates).where(eq(estates.id, session.scopeId));
    if (!est) return [];
    const groupEstates = await db.select().from(estates).where(eq(estates.groupId, est.groupId));
    return groupEstates;
  }
  return db.select().from(estates).where(eq(estates.id, session.scopeId ?? -1));
}

export async function workersForSession(session: Session) {
  const est = await estatesForSession(session);
  const ids = est.map(e => e.id);
  if (!ids.length) return [];
  return db.select().from(workers).where(inArray(workers.estateId, ids));
}
```

- [ ] **Step 2: Implement `DataTable.tsx` (generic columns+rows table, Tailwind-styled) and `StatCard.tsx` (label + value + delta).** Keep them presentational and typed.

```tsx
// components/StatCard.tsx
export function StatCard({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {delta && <div className="text-xs text-emerald-600">{delta}</div>}
    </div>
  );
}
```

```tsx
// components/DataTable.tsx
export function DataTable<T extends Record<string, any>>(
  { columns, rows }: { columns: { key: keyof T; label: string }[]; rows: T[] },
) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>{columns.map(c => <th key={String(c.key)} className="px-4 py-2 font-medium">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {columns.map(c => <td key={String(c.key)} className="px-4 py-2">{String(r[c.key] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/queries.ts components/DataTable.tsx components/StatCard.tsx
git commit -m "feat: role-scoped queries and shared UI primitives"
```

---

## Phase 5 — Module Screens

> Each screen is a Server Component that reads via `lib/db/queries.ts` (scoped to the session passed from a small client wrapper) or reads all-and-filters client-side for demo simplicity. Pattern for every module: **(a)** create the page, **(b)** wire real seeded data, **(c)** verify in browser, **(d)** commit. Requirement coverage per screen is noted.

### Task 5.1: Role Dashboard

**Files:** Create `app/(app)/dashboard/page.tsx`, `components/ProductionChart.tsx`

- [ ] **Step 1:** Build a dashboard that shows scope-appropriate `StatCard`s (total production, active workers, pending approvals, YoY %) and a `ProductionChart` (Recharts `BarChart`) of estate/group production. Use seeded data via a client fetch to a route handler OR render via a Server Component using `workersForSession`. For the demo, implement `ProductionChart.tsx` with Recharts and pass in static-derived series computed from seeded rows.
- [ ] **Step 2:** Verify each role shows a different scope (MD = all estates; AM = one estate).
- [ ] **Step 3:** Commit `feat: role-scoped dashboard with production chart`.

Covers: consolidation story, RBAC demonstration.

### Task 5.2: Employee Master & Check Roll (M1)

**Files:** Create `app/(app)/employees/page.tsx`, `app/(app)/employees/[id]/page.tsx`, `components/RetirementAlerts.tsx`

- [ ] **Step 1:** List page: `DataTable` of workers (Check Roll, name, category, type, gender, estate) with filter controls (gender, category, estate, age-group) driven by URL search params.
- [ ] **Step 2:** Detail page: full master data + unique Check Roll banner; a note that Check Roll is permanent and non-reusable.
- [ ] **Step 3:** `RetirementAlerts.tsx`: compute workers within 2 months of the configured retirement age (from `settings`) and show alert cards.
- [ ] **Step 4:** Verify filters narrow the table; retirement widget shows at least one alert (seed one worker near 58 if needed by editing seed `dob`).
- [ ] **Step 5:** Commit `feat: employee master, check roll, retirement alerts`.

Covers: Req 2, 16, 17, 18.

### Task 5.3: Attendance (M2)

**Files:** Create `app/(app)/attendance/page.tsx`, `components/ApprovalQueue.tsx`

- [ ] **Step 1:** Daily attendance table using `tapperAttendanceOutcome` to colour each row (Approved / Pending / Rejected). Show general-worker 8–5 and configurable category windows in a legend, and the tapper-on-non-tapping-duty 6:00–2:00 window.
- [ ] **Step 2:** `ApprovalQueue.tsx`: AM sees pending (6:15–6:30) rows with Approve/Reject buttons that POST to a route handler updating `attendance.status`; EM sees an "excess attendance" tab that marks records `isExcess` and notes "separate voucher — excluded from PF/Bonus/Seniority".
- [ ] **Step 3:** Verify approving a row persists to Neon and the row re-renders Approved.
- [ ] **Step 4:** Commit `feat: attendance with time-gated approvals and excess voucher`.

Covers: Req 3, 4, 5, 6.

### Task 5.4: Field Capture — phone frame (M3)

**Files:** Create `app/(app)/field/page.tsx`, `components/PhoneFrame.tsx`, `components/WeightSlip.tsx`

- [ ] **Step 1:** `PhoneFrame.tsx`: a CSS phone bezel wrapper with an "Offline · Synced" status pill.
- [ ] **Step 2:** Inside it, a latex/scrap entry form (worker, latex kg, scrap kg) that inserts a `collections` row (locked=true) and renders a `WeightSlip` (worker, kg, DRC, date) with an "SMS sent ✓" indicator and a Print button (`window.print()` on a print-styled sheet).
- [ ] **Step 3:** Show a locked badge on saved entries; a "Request correction (AM approval)" button that creates a Pending audit entry.
- [ ] **Step 4:** Verify an entry persists and the weight slip renders; print preview shows only the slip.
- [ ] **Step 5:** Commit `feat: field capture phone app with weight slips and lock`.

Covers: Req 20, 21.

### Task 5.5: Payroll / D4 Wage Engine + Malayalam slip (M4)

**Files:** Create `app/(app)/payroll/page.tsx`, `app/(app)/payroll/slip/[workerId]/page.tsx`, `components/PayslipMalayalam.tsx`

- [ ] **Step 1:** Payroll run screen: pick period (21–20), show computed lines per worker using `lib/engine/wages.ts` (`blockIncentive`, `statutoryDeductions`, `permanentAllowances`, `netPay`) and `lib/engine/drc.ts`. Show block class II/III/IV, DRC, gross, incentive, PF, weightage/washing (Permanent only), editable "Other recovery" input (EPF field shown locked/read-only), and net pay. Persist lines to `payrollLines`.
- [ ] **Step 2:** `PayslipMalayalam.tsx`: a print-styled slip using the `--font-ml` Malayalam font with labels in Malayalam (ശമ്പളം/കിഴിവുകൾ/ആകെ) and worker earnings/deductions. English operational UI elsewhere.
- [ ] **Step 3:** Verify: changing "Other recovery" updates net pay; EPF is not editable; slip renders Malayalam correctly and prints cleanly.
- [ ] **Step 4:** Commit `feat: payroll engine UI and Malayalam payslip`.

Covers: Req 7, 8, 9, 10, 12.

### Task 5.6: Leave & Weightage (M5)

**Files:** Create `app/(app)/leave/page.tsx`

- [ ] **Step 1:** Leave screen using `lib/engine/leave.ts`: medical-leave request form showing `medicalLeavePayable` result (paid days capped at 14, ⅔ wage), annual-leave balance from `annualLeaveAccrued`, and an eligibility gate hiding actions for non-Permanent workers (`isLeaveEligible`). Add a note: holiday-within-medical-leave overlap auto-resolved (no double benefit).
- [ ] **Step 2:** Persist leave records to `leaveRecords`; verify the 14-day cap blocks over-request.
- [ ] **Step 3:** Commit `feat: leave and weightage screen`.

Covers: Req 11.

### Task 5.7: Stock & Material (M6)

**Files:** Create `app/(app)/stock/page.tsx`, `components/RequisitionForm.tsx`

- [ ] **Step 1:** Inventory table (Latex/Scrap/Ammonia/chemicals) per estate with an estate→factory transfer form that decrements `stockItems.balance`. Show an ammonia-consumption-vs-latex ratio card.
- [ ] **Step 2:** `RequisitionForm.tsx`: create a requisition (cups, hangers, spouts, filters) → `requisitions` (Pending); AM view has Approve/Modify/Issue actions updating status.
- [ ] **Step 3:** Verify transfer updates balance; requisition approval persists.
- [ ] **Step 4:** Commit `feat: stock, transfers, and requisition workflow`.

Covers: Req 13, 14, 15.

### Task 5.8: Replanting (M7)

**Files:** Create `app/(app)/replanting/page.tsx`

- [ ] **Step 1:** Year-wise table from `replanting` (planting year ≥ 2014, area, census surviving/decayed/vacant, expenditure, yield). Add a census summary and a simple ROI card (yield value vs expenditure). Note yield begins year 7.
- [ ] **Step 2:** Verify seeded 2014 & 2018 rows render with census and ROI.
- [ ] **Step 3:** Commit `feat: replanting management with census and ROI`.

Covers: Req 22.

### Task 5.9: Reports & MIS + Documents generator (M8)

**Files:** Create `app/(app)/reports/page.tsx`, `components/DocumentSheet.tsx`, `app/(app)/reports/[doc]/page.tsx`

- [ ] **Step 1:** Reports screen: consolidated production grouped by estate/division/block/CC/group (toggle), each with a YoY comparative column and variance % (compute from seeded current vs a synthesized prior-year series).
- [ ] **Step 2:** Documents index linking to 9 generated documents. `DocumentSheet.tsx` renders a print-styled sheet; `[doc]/page.tsx` switches on the doc key to render: Daily Production Statement, Pocket Check Roll, Muster Chit, Payment Slip (reuses `PayslipMalayalam`), Crop Book Part 1 & 2, Production Performance, Final DRC Values, Daily Target & Achievement, Weight Slip (reuses `WeightSlip`).
- [ ] **Step 3:** Verify each document renders with seeded data and prints cleanly.
- [ ] **Step 4:** Commit `feat: reports, MIS comparatives, and 9 statutory documents`.

Covers: Req 19, 23.

### Task 5.10: Settings / Configuration

**Files:** Create `app/(app)/settings/page.tsx`

- [ ] **Step 1:** Editable form for `settings` rows (retirement age, working days, medical leave cap, PF %, and block-class targets/rates). Save updates the `settings` table; show that retirement alerts and payroll respond to changed values.
- [ ] **Step 2:** Verify changing retirement age to a lower value surfaces more retirement alerts.
- [ ] **Step 3:** Commit `feat: configuration settings screen`.

Covers: proposal §11 configurability.

---

## Phase 6 — Deploy

### Task 6.1: Deploy to Vercel with Neon integration

- [ ] **Step 1:** Push the repo to GitHub (`gh repo create` or via the GitHub UI) and import it into Vercel.
- [ ] **Step 2:** In Vercel, add the **Neon integration** (Marketplace) to the project — it auto-provisions `DATABASE_URL` / `DATABASE_URL_UNPOOLED` / `POSTGRES_*` env vars.
- [ ] **Step 3:** Run `vercel env pull .env.local` locally to sync, then `npm run db:push && npm run db:seed` against the Neon branch used by production (or run seed once via a one-off script).
- [ ] **Step 4:** Trigger a production deploy; open the deployment URL and walk through every role and module.
- [ ] **Step 5:** Verify the build has no external-network runtime calls (charts/fonts bundled). Commit any config fixes.

---

## Self-Review

**Spec coverage check (spec §6 table → task):**
- Req 1, 7 (RBAC) → Task 4.1, 4.4, 5.1 ✅
- Req 2, 16, 17, 18 (employee) → Task 5.2 ✅
- Req 3, 4, 5, 6 (attendance) → Task 3.4, 5.3 ✅
- Req 20, 21 (field capture) → Task 5.4 ✅
- Req 7, 8, 9, 12 (payroll) → Task 3.1, 3.2, 5.5 ✅
- Req 10 (Malayalam slip) → Task 4.3 (font), 5.5 ✅
- Req 11 (leave) → Task 3.3, 5.6 ✅
- Req 13, 14, 15 (stock) → Task 5.7 ✅
- Req 22 (replanting) → Task 5.8 ✅
- Req 19, 23 (reports + documents) → Task 5.9 ✅
- Configurability (§11) → Task 1.2 (settings table), 2.1 (seed), 5.10 ✅
- NFRs (audit log, offline pill, locked data, security note) → schema `auditLog` (1.2), PhoneFrame pill (5.4), locked badges (5.4), scope banner (4.4) ✅

**Placeholder scan:** Engine tasks (Phase 3) and shell tasks (Phase 4) contain complete code. UI tasks (Phase 5) intentionally specify files, seeded data source, exact requirement coverage, and verify/commit steps while reusing the primitives (`DataTable`, `StatCard`, `PhoneFrame`, `PayslipMalayalam`, `WeightSlip`, `DocumentSheet`) built in earlier tasks — no undefined types are referenced.

**Type consistency:** `Session { role, scopeId }`, `RoleId`, `Category`, and engine signatures (`blockIncentive`, `statutoryDeductions`, `permanentAllowances`, `netPay`, `consolidateDrc`, `dryRubberKg`, `medicalLeavePayable`, `annualLeaveAccrued`, `isLeaveEligible`, `tapperAttendanceOutcome`) are defined once in Phase 3/4 and reused consistently in Phase 5.

---
```

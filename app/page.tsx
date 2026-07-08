'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Leaf,
  ArrowRight,
  Rocket,
  Smartphone,
  Building2,
  Landmark,
  Users,
  MapPin,
  CalendarCheck,
  CalendarDays,
  Wallet,
  Package,
  Sprout,
  ChartColumn,
  ShieldCheck,
  FileText,
  Languages,
  Sparkles,
  MousePointerClick,
  type LucideIcon,
} from 'lucide-react';

import { ProductionPulse } from '@/components/ProductionPulse';
import { RadialGauge } from '@/components/RadialGauge';
import { Donut } from '@/components/Donut';
import { StatCard } from '@/components/StatCard';
import { Timeline } from '@/components/Timeline';
import { categoryMix } from '@/lib/widgets/mix';
import { ROLES, type RoleId } from '@/lib/rbac';

// Lazy-load the only Recharts-based widget: it sits below the fold, so keeping it out of
// the landing's initial JS bundle cuts Total Blocking Time without affecting LCP.
// Placeholder matches the chart's h-80 card so there is no layout shift.
const ProductionChart = dynamic(
  () => import('@/components/ProductionChart').then((m) => m.ProductionChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 w-full rounded-2xl border border-line bg-white shadow-card" aria-hidden="true" />
    ),
  },
);

/* ------------------------------------------------------------------ */
/* Static demo data                                                    */
/* ------------------------------------------------------------------ */

const LATEX_TOTAL = 38378;
const UNIT = 'kg';
const YOY = 45.7;
const AVG_DRC = 42.5;

const DAILY = [1044, 1094, 1156, 899, 972, 1130, 1215, 1167, 1236, 1312, 1070, 1277, 1361, 1397];

const WORKFORCE = { Permanent: 32, Casual: 16, Dependent: 16 };

const BY_ESTATE = [
  { estate: 'Chithalvetty', current: 9703, prior: 6660 },
  { estate: 'Kumaramkudy', current: 9486, prior: 7010 },
  { estate: 'Mullumala', current: 9703, prior: 6980 },
  { estate: 'Cheruppittakkavu', current: 9486, prior: 6640 },
];

const TIMELINE: { title: string; meta: string; time: string; tone: 'emerald' | 'clay' }[] = [
  { title: 'factory-dispatch', meta: 'Assistant Manager · stock:1 qty:150', time: '08 Jul, 01:13', tone: 'emerald' },
  { title: 'correction-approved', meta: 'Assistant Manager · collection:57', time: '08 Jul, 01:13', tone: 'emerald' },
  { title: 'excess-voucher-created', meta: 'Estate Manager · attendance:24', time: '08 Jul, 01:13', tone: 'clay' },
  { title: 'attendance-approved', meta: 'Assistant Manager · attendance:12', time: '08 Jul, 01:13', tone: 'emerald' },
];

const NAV_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#portals', label: 'Portals' },
  { href: '#modules', label: 'Modules' },
  { href: '#features', label: 'Features' },
  { href: '#roles', label: 'Roles' },
  { href: '#docs', label: 'Docs' },
];

const PORTALS: { icon: LucideIcon; title: string; who: string; specs: string[] }[] = [
  {
    icon: Smartphone,
    title: 'Field Data App',
    who: 'Collection Workers & Supervisors',
    specs: [
      'Daily attendance at the collection centre',
      'Latex & scrap weight capture with DRC',
      'SMS weight slips to workers',
      'Offline-first capture with background sync',
    ],
  },
  {
    icon: Building2,
    title: 'Estate Operations',
    who: 'AM · EM · FO',
    specs: [
      'Division & collection-centre management',
      'Attendance and correction approvals',
      'Wage processing & stock transfers',
      'Estate-level production reporting',
    ],
  },
  {
    icon: Landmark,
    title: 'Head Office Console',
    who: 'MD · GM',
    specs: [
      'Consolidated production across estates',
      'Corporation-wide payroll oversight',
      'Comparative MIS & performance ranking',
      'Statutory document generation',
    ],
  },
];

const MODULES: { id: string; icon: LucideIcon; title: string; desc: string }[] = [
  { id: 'M1', icon: Users, title: 'Employee Master & Check Roll', desc: 'Worker records, PF/ESI, and the daily check-roll register.' },
  { id: 'M2', icon: CalendarCheck, title: 'Attendance', desc: 'Muster capture, corrections, approvals and overtime.' },
  { id: 'M3', icon: Smartphone, title: 'Field Capture', desc: 'Latex & scrap weights and DRC readings from the field.' },
  { id: 'M4', icon: Wallet, title: 'Payroll — D4 Wage Engine', desc: 'D4 wage computation, deductions and Malayalam payslips.' },
  { id: 'M5', icon: CalendarDays, title: 'Leave & Weightage', desc: 'Leave balances, weightage and eligibility rules.' },
  { id: 'M6', icon: Package, title: 'Stock & Material', desc: 'Latex stock, dispatch vouchers and material transfers.' },
  { id: 'M7', icon: Sprout, title: 'Replanting', desc: 'Block-wise replanting schedules and progress tracking.' },
  { id: 'M8', icon: ChartColumn, title: 'Reports & MIS', desc: 'Consolidated production, payroll and comparative MIS.' },
];

const ROLE_ACCESS: Record<RoleId, string> = {
  cc: 'Field capture and attendance for the single collection centre they are assigned to — nothing beyond it.',
  fo: 'Attendance, employees and reports for the divisions they supervise within their estate.',
  am: 'The whole estate: approvals for attendance, corrections, wages and stock across every division and CC.',
  em: 'Their estate group — payroll, leave, stock and reporting consolidated across the estates they manage.',
  md: 'Corporation-wide visibility: every estate, all payroll and the full comparative MIS. Unrestricted, read-across.',
};

const DOCUMENTS: { name: string; malayalam?: boolean }[] = [
  { name: 'Daily Production Statement' },
  { name: 'Pocket Check Roll' },
  { name: 'Muster Chit' },
  { name: 'Payment Slip (Malayalam)', malayalam: true },
  { name: 'Crop Book Part 1' },
  { name: 'Crop Book Part 2' },
  { name: 'Production Performance of Estates' },
  { name: 'Final DRC Values' },
  { name: 'Daily Target & Achievement' },
  { name: 'Weight Slip' },
];

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-brand">{eyebrow}</div>
      <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
      {lead && <p className="mt-3 text-sm text-muted sm:text-base">{lead}</p>}
    </div>
  );
}

function LogoMark() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-card"
      style={{ background: 'linear-gradient(135deg, var(--emerald), var(--leaf))' }}
      aria-hidden="true"
    >
      <Leaf className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}

function FeatureTag({ children, tone = 'emerald' }: { children: React.ReactNode; tone?: 'emerald' | 'clay' }) {
  const cls =
    tone === 'clay'
      ? 'bg-orange-50 text-[color:var(--clay)] ring-[color:var(--clay)]/20'
      : 'bg-emerald-50 text-emerald-brand ring-emerald-brand/20';
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${cls}`}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Landing() {
  const [activeRole, setActiveRole] = useState<RoleId>('md');
  const role = ROLES.find((r) => r.id === activeRole)!;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Smooth anchor scrolling for this page only */}
      <style>{`html{scroll-behavior:smooth}`}</style>

      {/* 1 — Sticky nav ------------------------------------------------ */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="#overview" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-base font-bold tracking-tight text-ink sm:text-lg">
              SFCK Plantation ERP
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted transition-colors hover:text-emerald-brand"
              >
                {l.label}
              </a>
            ))}
          </div>

          <Link
            href="/login"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-brand px-3.5 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <Rocket className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">Launch live demo</span>
            <span className="sm:hidden">Launch</span>
          </Link>
        </nav>
      </header>

      <main>
        {/* 2 — Hero --------------------------------------------------- */}
        <section
          id="overview"
          className="relative scroll-mt-20 overflow-hidden text-white"
          style={{ background: 'linear-gradient(160deg, var(--canopy), var(--canopy-2))' }}
        >
          <Sprout
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-10 h-80 w-80 text-leaf/[0.06] lg:h-[30rem] lg:w-[30rem]"
            strokeWidth={1}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.22), transparent 70%)' }}
          />

          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-leaf ring-1 ring-white/15">
                <Leaf className="h-3.5 w-3.5" />
                The State Farming Corporation of Kerala Ltd.
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-5xl xl:text-6xl">
                Run the entire plantation from one console.
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
                SFCK Plantation ERP unifies field capture, attendance, the D4 wage engine, stock and
                comparative MIS across every estate — with Malayalam payslips and a full, locked audit
                trail. Estate to head office, one source of truth.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-canopy shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-canopy"
                >
                  <Rocket className="h-4 w-4" />
                  Launch live demo
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10"
                >
                  See the features
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
                <span className="flex items-center gap-1.5"><span className="mono font-semibold text-leaf">4</span> estates</span>
                <span aria-hidden className="text-white/25">·</span>
                <span className="flex items-center gap-1.5"><span className="mono font-semibold text-leaf">16</span> collection centres</span>
                <span aria-hidden className="text-white/25">·</span>
                <span className="flex items-center gap-1.5"><span className="mono font-semibold text-leaf">64</span> workers</span>
                <span aria-hidden className="text-white/25">·</span>
                <span className="flex items-center gap-1.5"><Languages className="h-3.5 w-3.5 text-leaf" /> Malayalam payslips</span>
              </div>
            </div>

            <div className="animate-rise" style={{ '--rise-delay': '120ms' } as React.CSSProperties}>
              <ProductionPulse
                label="Season latex to date"
                value={LATEX_TOTAL}
                unit={UNIT}
                series={DAILY}
                chips={[
                  { label: 'YoY', value: `+${YOY}%`, tone: 'up' },
                  { label: '14-day', value: '+33.8%', tone: 'up' },
                ]}
              />
            </div>
          </div>
        </section>

        {/* 3 — Stat band --------------------------------------------- */}
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Estates', value: '4', icon: <Building2 className="h-5 w-5" /> },
              { label: 'Collection Centres', value: '16', icon: <MapPin className="h-5 w-5" /> },
              { label: 'Workers', value: '64', icon: <Users className="h-5 w-5" /> },
              { label: 'Statutory documents', value: '10', icon: <FileText className="h-5 w-5" /> },
            ].map((s, i) => (
              <div key={s.label} className="h-full animate-rise" style={{ '--rise-delay': `${i * 80}ms` } as React.CSSProperties}>
                <StatCard label={s.label} value={s.value} icon={s.icon} />
              </div>
            ))}
          </div>
        </section>

        {/* 4 — Portals ----------------------------------------------- */}
        <section id="portals" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Three tiers, one system"
              title="A portal for every level of the corporation"
              lead="From the tapper at the collection centre to the Managing Director in head office — each role gets exactly the console it needs."
            />
            <div className="mt-10 grid items-stretch gap-4 md:grid-cols-3">
              {PORTALS.map((p, i) => (
                <div
                  key={p.title}
                  className="flex h-full animate-rise flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                  style={{ '--rise-delay': `${i * 90}ms` } as React.CSSProperties}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-brand">
                    <p.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{p.title}</h3>
                  <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{p.who}</div>
                  <ul className="mt-4 space-y-2.5">
                    {p.specs.map((spec) => (
                      <li key={spec} className="flex gap-2.5 text-sm text-ink/80">
                        <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-leaf" strokeWidth={2} />
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 — Modules ----------------------------------------------- */}
        <section id="modules" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="8 functional modules"
            title="Everything the plantation runs on"
            lead="A complete operational spine — from the employee master to comparative MIS — built to the SFCK requirement spec."
          />
          <div className="mt-10 grid items-stretch gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((m, i) => (
              <div
                key={m.id}
                className="flex h-full animate-rise flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
                style={{ '--rise-delay': `${i * 60}ms` } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-brand">
                    <m.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="mono text-xs font-semibold text-muted">{m.id}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink">{m.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6 — Interactive features (emphasised centrepiece) --------- */}
        <section
          id="features"
          className="relative scroll-mt-20 border-y border-emerald-brand/15 py-16 sm:py-24"
          style={{ background: 'radial-gradient(130% 90% at 50% 0%, #e7f6ee 0%, var(--paper) 55%)' }}
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            {/* Emphasised heading */}
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-brand/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-brand ring-1 ring-emerald-brand/20">
                <Sparkles className="h-3.5 w-3.5" /> The interactive core
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold leading-[1.08] text-ink sm:text-4xl xl:text-5xl">
                Not screenshots — the live console, right here.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
                Every chart, gauge and table below is the{' '}
                <span className="font-semibold text-ink">exact React component</span> that runs the estate
                console — rendering real demo data as you scroll.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                {[
                  { icon: ChartColumn, label: 'Real production data' },
                  { icon: MousePointerClick, label: 'Interactive & live' },
                  { icon: ShieldCheck, label: 'Locked audit trail' },
                ].map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-card"
                  >
                    <c.icon className="h-3.5 w-3.5 text-emerald-brand" strokeWidth={2} /> {c.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Row A: comparative chart (2/3) + gauge (1/3) */}
            <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
              <div className="h-full animate-rise lg:col-span-2">
                <figure className="flex h-full flex-col">
                  <div className="mb-3"><FeatureTag>Year-on-year comparative MIS</FeatureTag></div>
                  <ProductionChart data={BY_ESTATE} />
                  <figcaption className="mt-3 text-sm text-muted">
                    Current vs prior season production, estate by estate.
                  </figcaption>
                </figure>
              </div>
              <div className="h-full animate-rise" style={{ '--rise-delay': '90ms' } as React.CSSProperties}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card">
                  <FeatureTag>CC-wise DRC consolidation</FeatureTag>
                  <p className="mt-2 text-sm text-muted">Average dry rubber content across all collection centres.</p>
                  <div className="mt-auto flex items-center justify-center pt-4">
                    <RadialGauge value={AVG_DRC} max={100} label="Avg DRC" unit="%" />
                  </div>
                </div>
              </div>
            </div>

            {/* Row B: workforce donut + daily trend + audit timeline */}
            <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-3">
              <div className="h-full animate-rise">
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card">
                  <FeatureTag>Workforce classification</FeatureTag>
                  <p className="mt-2 text-sm text-muted">Permanent, Casual & Dependent split across the corporation.</p>
                  <div className="mt-auto flex flex-1 items-center justify-center pt-4">
                    <Donut segments={categoryMix(WORKFORCE)} />
                  </div>
                </div>
              </div>

              <div className="h-full animate-rise" style={{ '--rise-delay': '90ms' } as React.CSSProperties}>
                <div className="flex h-full flex-col gap-3">
                  <FeatureTag>Live sparkline KPI</FeatureTag>
                  <div className="flex-1">
                    <StatCard label="Daily production trend" value="1,397 kg" delta="+33.8% 14-day" tone="up" series={DAILY} />
                  </div>
                </div>
              </div>

              <div className="h-full animate-rise" style={{ '--rise-delay': '180ms' } as React.CSSProperties}>
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card">
                  <FeatureTag tone="clay">Audit trail — data integrity</FeatureTag>
                  <p className="mt-2 text-sm text-muted">Locked data with a full, immutable audit log.</p>
                  <div className="mt-auto pt-2">
                    <Timeline items={TIMELINE} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7 — Roles / RBAC ------------------------------------------ */}
        <section id="roles" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="Role-based access control"
            title="Every user sees only their jurisdiction"
            lead="Five roles, each bound to a scope. Select one to see what it unlocks."
          />

          <div
            className="mt-10 overflow-hidden rounded-2xl border border-line p-6 text-white shadow-card sm:p-8"
            style={{ background: 'linear-gradient(160deg, var(--canopy), var(--canopy-2))' }}
          >
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const active = r.id === activeRole;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveRole(r.id)}
                    aria-pressed={active}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-canopy ${
                      active
                        ? 'bg-white text-canopy shadow-card'
                        : 'bg-white/10 text-white/80 ring-1 ring-white/15 hover:bg-white/20'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-leaf">Scope</div>
                <div className="mono mt-1 text-2xl font-bold">{role.scope}</div>
              </div>
              <div className="sm:border-l sm:border-white/15 sm:pl-6">
                <div className="font-display text-xl font-bold">{role.label}</div>
                <p className="mt-2 max-w-2xl text-sm text-white/75">{ROLE_ACCESS[activeRole]}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8 — Documents / Malayalam --------------------------------- */}
        <section id="docs" className="scroll-mt-20 bg-white py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="10 statutory documents"
              title="Compliance-ready, in the right language"
              lead="Every register and slip the estate is required to produce — including a worker-facing Malayalam payslip."
            />
            <div className="mt-10 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {DOCUMENTS.map((d, i) => (
                <div
                  key={d.name}
                  className={`flex animate-rise items-center gap-3 rounded-2xl border p-4 shadow-card transition-shadow hover:shadow-card-hover ${
                    d.malayalam ? 'border-emerald-brand/40 bg-emerald-50/60' : 'border-line bg-white'
                  }`}
                  style={{ '--rise-delay': `${i * 40}ms` } as React.CSSProperties}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      d.malayalam ? 'bg-emerald-brand text-white' : 'bg-latex text-emerald-brand'
                    }`}
                  >
                    <FileText className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{d.name}</div>
                    {d.malayalam && (
                      <div className="text-sm font-semibold text-emerald-brand" style={{ fontFamily: 'var(--font-ml)' }}>
                        ശമ്പള സ്ലിപ്പ്
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9 — Final CTA + footer ------------------------------------ */}
        <section
          className="relative overflow-hidden text-white"
          style={{ background: 'linear-gradient(160deg, var(--canopy), var(--canopy-2))' }}
        >
          <Sprout
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -right-10 h-72 w-72 text-leaf/[0.06] lg:h-96 lg:w-96"
            strokeWidth={1}
          />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Explore the live demo</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/75">
              Step into any role and see the estate console with realistic plantation data — no signup required.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-canopy shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-canopy"
              >
                <Rocket className="h-4 w-4" />
                Launch live demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-line bg-paper">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="text-xs text-muted">
                © 2026 The State Farming Corporation of Kerala Ltd. · Government of Kerala Undertaking
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-latex px-3 py-1 text-[11px] font-semibold text-muted">
              <Leaf className="h-3.5 w-3.5 text-emerald-brand" />
              Built as a demo
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

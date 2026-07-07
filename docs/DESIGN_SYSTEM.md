# SFCK Estate Console — Design System

The **Dashboard** (`app/(app)/dashboard/page.tsx`) is the canonical reference. Every other screen must follow the conventions below so the app reads as one consistent product. This doc exists because widgets were rendering at uneven heights — see **§4 The Card Contract** for the root cause and the rule that prevents it.

---

## 1. Tokens

Defined as CSS custom properties in `app/globals.css` (do not hardcode hexes in components — use the token or its Tailwind equivalent).

| Token | Hex | Use |
|---|---|---|
| `--canopy` / `--canopy-2` | `#0B3D2E` / `#124E3A` | Sidebar + Production-Pulse hero gradient |
| `--paper` | `#F4F7F5` | App content background (body) |
| white | `#FFFFFF` | Card surfaces |
| `--emerald` | `#059669` | Primary accent, positive/current, links, active |
| `--leaf` | `#34D399` | Chart/data highlight, on-dark accents |
| `--latex` | `#F7F5EF` | Soft accent surface (legend pills, out-of-scope rows) |
| `--clay` | `#C2603A` | Negative / alert / restricted / "needs action" |
| `--ink` | `#12211B` | Primary text |
| `--muted` | `#5B6B63` | Secondary text, micro-labels |
| `--line` | `#E2ECE7` | Borders + hairline dividers |

**Semantic colour is separate from the accent:** emerald = positive/approved, clay = negative/alert/restricted, slate = neutral/locked. Never use raw amber/red — use clay.

## 2. Typography

| Role | Family (CSS var) | Usage |
|---|---|---|
| Display | `--font-display` (Bricolage Grotesque) | `h1`/`h2`/`h3` (auto via globals), big headings. `-0.02em` tracking. |
| Body | `--font-inter` (Inter) | Default body, labels, table cells. |
| Mono | `--font-mono` (JetBrains Mono) via `.mono` | **All numeric readouts** — KPI values, kg/₹/%, table figures. Always pairs with tabular alignment. |
| Malayalam | `--font-ml` (Noto Sans Malayalam) | Worker-facing salary slips only. |

- Micro-label (stat captions, table headers): `text-[11px] font-semibold uppercase tracking-wider text-muted`.
- Section header inside a card: `text-lg font-semibold text-ink` (`<h2>`).
- Page title: `<h1 className="text-2xl font-semibold text-ink">`.
- Any column of numbers uses `.mono` (or `.tnum` for Inter tabular).

## 3. Spacing, radius, elevation

- **Page:** wrap content in `<div className="space-y-6">` — every major row is separated by `space-y-6`.
- **Grids within a row:** `grid items-stretch gap-4 …` (see §4 for `items-stretch`). Use `gap-4` between cards.
- **Card radius:** `rounded-2xl` (widgets/cards). Pills/badges: `rounded-full`. Small inputs/buttons: `rounded-lg`.
- **Card padding:** `p-5` (default). The Production Pulse hero and the gauge card use `p-6`.
- **Elevation:** `shadow-card` (+ `hover:shadow-card-hover` for interactive cards). No `shadow-sm`/`shadow-md`.
- **Borders:** `border border-line`. Table row dividers: `border-line` hairlines, no zebra striping.

## 4. The Card Contract  ⭐ (the fix for uneven widgets)

**Root cause of uneven widgets:** CSS Grid stretches its cells to equal height (`align-items: stretch`), but a card that lacks `h-full` renders at its *intrinsic content height* and sits top-aligned in the taller cell. So a card with a chip/sparkline is taller than a plain one → uneven bottoms.

**Rule — every card is:**

```
flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card
```

- `h-full` makes the card fill its (stretched) grid cell.
- `flex flex-col` lets content distribute vertically.
- **Bottom-anchored extras** (delta chip, sparkline, CTA row) go in a wrapper with `mt-auto` so the top content (label/value) aligns across all cards and the card fills the height.

**Grid rule — the row that holds cards is:**

```
grid items-stretch gap-4 lg:grid-cols-N
```

and if a card is wrapped (e.g. for `animate-rise` or `lg:col-span-2`), the **wrapper also gets `h-full`** so the card's `h-full` has a stretched parent to fill:

```jsx
<div className="grid items-stretch gap-4 lg:grid-cols-4">
  <div className="h-full animate-rise" style={{ '--rise-delay': '120ms' }}>
    <StatCard … />   {/* StatCard root is `flex h-full flex-col …` */}
  </div>
</div>
```

**Verification:** cards in a row must measure equal height. A quick check (Playwright): every card's `getBoundingClientRect().height` in a row must be equal (±2px). This is how the dashboard was validated (`[145,145,145,145]`).

For a two-column row where one column has an extra note below the card, wrap the column in `flex h-full flex-col` and give the card `flex-1` so both cards still match.

## 5. Widget catalog

Reuse these — do not hand-roll new card variants.

| Component | Use |
|---|---|
| `StatCard` | KPI: micro-label + `.mono` value + optional delta chip / `series` sparkline (pinned bottom). Root is the card contract. |
| `ProductionPulse` | The signature hero: canopy gradient, mono count-up, chips, area sparkline. `h-full`. |
| `RadialGauge` | Single ratio/percentage (e.g. Avg DRC, target achievement). Place in a card contract wrapper. |
| `Donut` | Category/segment mix (e.g. workforce). Centre it with `flex flex-1 items-center justify-center`. |
| `Sparkline` | Inline trend inside cards. |
| `ProductionChart` | Comparative bar chart (current vs prior). Fixed `h-80` card; other cards in its row use `h-full` to match. |
| `Timeline` | Chronological/audit lists (dot + line). |
| `Badge` | Status/category pill: `tone` = `emerald | amber | rose | slate`. |
| `DataTable` (or matching markup) | Dense tables: micro-label headers, `border-line` hairline dividers, `.mono`/`.tnum` figures, no zebra. |

## 6. Page layout template

```jsx
export default function Screen() {
  // …fetch via useScopedData
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Screen Title</h1>

      {/* optional alert band: rounded-lg bg-orange-50 px-3 py-2 text-[color:var(--clay)] */}

      {/* KPI/stat row */}
      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* StatCards, each wrapped h-full if the wrapper adds classes */}
      </div>

      {/* main content: a card (contract) holding a table / chart / form */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="text-lg font-semibold text-ink">Section</h2>
        {/* table / chart / form */}
      </div>
    </div>
  );
}
```

## 7. Interaction & a11y

- Interactive cards/buttons: emerald on hover/active, visible `focus-visible` ring, `hover:shadow-card-hover`.
- Motion: `.animate-rise` with a staggered `--rise-delay`; all motion is disabled under `prefers-reduced-motion` (already wired in globals). Do not add motion that ignores it.
- Buttons say what they do (`Finalize payroll run`, then a matching confirmation). Errors use clay and explain the fix.

## 8. Consistency checklist (apply to every screen)

- [ ] Page is `space-y-6`; title is `h1 text-2xl font-semibold text-ink`.
- [ ] Every card uses the **card contract** (`flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card`).
- [ ] Every card grid uses `grid items-stretch gap-4`; wrapped cards get `h-full`.
- [ ] Cards in a row measure equal height.
- [ ] Numeric values use `.mono`; tables use micro-label headers + `border-line` dividers, no zebra.
- [ ] Status/category use `Badge` (emerald/amber/rose/slate) — never raw amber/red.
- [ ] Section headers are `h2 text-lg font-semibold text-ink`.
- [ ] Radius `rounded-2xl`, padding `p-5`, elevation `shadow-card`, borders `border-line`.

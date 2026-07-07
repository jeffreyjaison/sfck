import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { replanting } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const RUBBER_PRICE_PER_KG = 220;
const DEMO_CURRENT_YEAR = 2026;
const YEARS_TO_YIELD = 7;

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const estates = await estatesForSession(session);
  const estateName = new Map(estates.map((e) => [e.id, e.name]));
  const estateIds = estates.map((e) => e.id);

  if (!estateIds.length) {
    return NextResponse.json({
      rows: [],
      census: { surviving: 0, decayed: 0, vacant: 0 },
      roi: { expenditure: 0, yieldKg: 0, yieldValue: 0, roiPct: 0 },
    });
  }

  const rs = await db.select().from(replanting).where(inArray(replanting.estateId, estateIds));

  const rows = rs.map((r) => {
    const yieldStartYear = r.plantingYear + YEARS_TO_YIELD;
    const producing = DEMO_CURRENT_YEAR >= yieldStartYear;
    return {
      id: r.id,
      estate: estateName.get(r.estateId) ?? '',
      blockCode: r.blockCode,
      plantingYear: r.plantingYear,
      areaHa: Number(r.areaHa),
      surviving: r.surviving,
      decayed: r.decayed,
      vacant: r.vacant,
      expenditure: Number(r.expenditure),
      yieldKg: Number(r.yieldKg),
      yieldStartYear,
      producing,
      status: producing ? 'Producing' : 'Immature',
    };
  });

  const census = rows.reduce(
    (acc, r) => ({
      surviving: acc.surviving + r.surviving,
      decayed: acc.decayed + r.decayed,
      vacant: acc.vacant + r.vacant,
    }),
    { surviving: 0, decayed: 0, vacant: 0 },
  );

  const expenditure = rows.reduce((sum, r) => sum + r.expenditure, 0);
  const yieldKg = rows.reduce((sum, r) => sum + r.yieldKg, 0);
  const yieldValue = yieldKg * RUBBER_PRICE_PER_KG;
  const roiPct = expenditure > 0 ? Math.round(((yieldValue - expenditure) / expenditure) * 100 * 10) / 10 : 0;

  return NextResponse.json({
    rows,
    census,
    roi: { expenditure, yieldKg, yieldValue, roiPct },
  });
}

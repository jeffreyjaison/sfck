import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { estatesForSession, workersForSession } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
// Fixed reference date so the demo behaves deterministically regardless of run date.
const DEMO_TODAY = new Date('2026-07-07');

function ageOn(dob: string, on: Date): number {
  const d = new Date(dob);
  let age = on.getFullYear() - d.getFullYear();
  const m = on.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < d.getDate())) age--;
  return age;
}

export async function GET(req: Request) {
  const session = sessionFromRequest(req);
  const estates = await estatesForSession(session);
  const estateName = new Map(estates.map((e) => [e.id, e.name]));
  const ws = await workersForSession(session);
  const [retAgeRow] = await db.select().from(settings).where(eq(settings.key, 'retirement_age'));
  const retAge = Number(retAgeRow?.value ?? 58);

  const workers = ws.map((w) => ({
    id: w.id, checkRoll: w.checkRoll, name: w.name, category: w.category, type: w.type,
    gender: w.gender, dob: w.dob, dateOfJoining: w.dateOfJoining, mobile: w.mobile,
    estate: estateName.get(w.estateId) ?? '', age: ageOn(w.dob, DEMO_TODAY),
  }));

  const twoMonths = new Date(DEMO_TODAY);
  twoMonths.setMonth(twoMonths.getMonth() + 2);
  const retirementAlerts = ws
    .map((w) => {
      const retiresAt = new Date(w.dob);
      retiresAt.setFullYear(retiresAt.getFullYear() + retAge);
      return { id: w.id, checkRoll: w.checkRoll, name: w.name, retiresAt };
    })
    .filter((a) => a.retiresAt >= DEMO_TODAY && a.retiresAt <= twoMonths)
    .map((a) => ({ id: a.id, checkRoll: a.checkRoll, name: a.name, retiresOn: a.retiresAt.toISOString().slice(0, 10) }));

  return NextResponse.json({
    workers,
    retirementAlerts,
    estates: estates.map((e) => ({ id: e.id, name: e.name })),
    retirementAge: retAge,
  });
}

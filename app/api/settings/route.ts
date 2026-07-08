import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { canManageSettings } from '@/lib/authz';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.select().from(settings).orderBy(asc(settings.key));
  return NextResponse.json({ settings: rows });
}

export async function POST(req: Request) {
  const session = sessionFromRequest(req);
  if (!canManageSettings(session.role)) {
    return NextResponse.json({ error: 'Not authorized to change settings' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const key = body?.key;
  const value = body?.value;
  if (typeof key !== 'string' || typeof value !== 'string') {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
  }
  // All settings are numeric wage/engine parameters — reject garbage before it
  // reaches payroll math.
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return NextResponse.json({ error: 'value must be a non-negative number' }, { status: 400 });
  }
  const [existing] = await db.select().from(settings).where(eq(settings.key, key));
  if (!existing) {
    return NextResponse.json({ error: 'Unknown setting key' }, { status: 400 });
  }
  await db.update(settings).set({ value }).where(eq(settings.key, key));
  return NextResponse.json({ ok: true });
}

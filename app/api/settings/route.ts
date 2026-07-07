import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.select().from(settings).orderBy(asc(settings.key));
  return NextResponse.json({ settings: rows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const key = body?.key;
  const value = body?.value;
  if (typeof key !== 'string' || typeof value !== 'string') {
    return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
  }
  const [existing] = await db.select().from(settings).where(eq(settings.key, key));
  if (!existing) {
    return NextResponse.json({ error: 'Unknown setting key' }, { status: 400 });
  }
  await db.update(settings).set({ value }).where(eq(settings.key, key));
  return NextResponse.json({ ok: true });
}

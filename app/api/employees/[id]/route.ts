import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/api-session';
import { workersForSession, estatesForSession } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessionFromRequest(req);
  const ws = await workersForSession(session);
  const w = ws.find((x) => String(x.id) === id);
  if (!w) return NextResponse.json({ error: 'Not found or out of scope' }, { status: 404 });
  const estates = await estatesForSession(session);
  const estate = estates.find((e) => e.id === w.estateId)?.name ?? '';
  return NextResponse.json({ ...w, estate });
}

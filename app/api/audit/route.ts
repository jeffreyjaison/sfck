import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { auditLog } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(15);
  return NextResponse.json({
    entries: rows.map((r) => ({
      id: r.id,
      actorRole: r.actorRole,
      action: r.action,
      entity: r.entity,
      at: r.at,
    })),
  });
}

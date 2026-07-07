import { db } from './client';
import { estates, workers, divisions, collectionCentres } from './schema';
import { eq, inArray } from 'drizzle-orm';
import type { Session } from '@/lib/rbac';

export async function estatesForSession(session: Session) {
  if (session.role === 'md') return db.select().from(estates);
  if (session.role === 'cc') {
    if (!session.scopeId) return [];
    const [cc] = await db.select().from(collectionCentres).where(eq(collectionCentres.id, session.scopeId));
    if (!cc) return [];
    const [div] = await db.select().from(divisions).where(eq(divisions.id, cc.divisionId));
    if (!div) return [];
    return db.select().from(estates).where(eq(estates.id, div.estateId));
  }
  if (session.role === 'em' && session.scopeId) {
    const [est] = await db.select().from(estates).where(eq(estates.id, session.scopeId));
    if (!est) return [];
    return db.select().from(estates).where(eq(estates.groupId, est.groupId));
  }
  return db.select().from(estates).where(eq(estates.id, session.scopeId ?? -1));
}

export async function workersForSession(session: Session) {
  if (session.role === 'cc') {
    if (!session.scopeId) return [];
    return db.select().from(workers).where(eq(workers.ccId, session.scopeId));
  }
  const est = await estatesForSession(session);
  const ids = est.map((e) => e.id);
  if (!ids.length) return [];
  return db.select().from(workers).where(inArray(workers.estateId, ids));
}

export async function ccsForSession(session: Session) {
  if (session.role === 'cc') {
    if (!session.scopeId) return [];
    return db.select().from(collectionCentres).where(eq(collectionCentres.id, session.scopeId));
  }
  const est = await estatesForSession(session);
  const ids = est.map((e) => e.id);
  if (!ids.length) return [];
  const divs = await db.select().from(divisions).where(inArray(divisions.estateId, ids));
  const divIds = divs.map((d) => d.id);
  if (!divIds.length) return [];
  return db.select().from(collectionCentres).where(inArray(collectionCentres.divisionId, divIds));
}

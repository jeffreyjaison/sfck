import type { Session, RoleId } from '@/lib/rbac';

const KNOWN_ROLES: ReadonlySet<string> = new Set<RoleId>(['cc', 'fo', 'am', 'em', 'md']);

export function sessionFromRequest(req: Request): Session {
  const url = new URL(req.url);
  // Least-privilege default: an absent or unknown role degrades to 'cc', never 'md'.
  const roleParam = url.searchParams.get('role') ?? '';
  const role = (KNOWN_ROLES.has(roleParam) ? roleParam : 'cc') as RoleId;
  const scopeParam = url.searchParams.get('scopeId');
  const parsed = scopeParam && scopeParam !== '' ? Number(scopeParam) : null;
  const scopeId = parsed !== null && Number.isFinite(parsed) ? parsed : null;
  return { role, scopeId };
}

import type { Session, RoleId } from '@/lib/rbac';

export function sessionFromRequest(req: Request): Session {
  const url = new URL(req.url);
  const role = (url.searchParams.get('role') ?? 'md') as RoleId;
  const scopeParam = url.searchParams.get('scopeId');
  const scopeId = scopeParam && scopeParam !== '' ? Number(scopeParam) : null;
  return { role, scopeId };
}

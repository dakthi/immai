import { auth } from '@/app/(auth)/auth';
import type { UserRole } from '@/app/(auth)/auth';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Authentication required');
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Insufficient permissions');
  }
  return session;
}

export async function requirePaidUser() {
  return requireRole(['paiduser', 'admin']);
}

export async function requireAdmin() {
  return requireRole(['admin']);
}

export function isPaidUser(role: UserRole): boolean {
  return role === 'paiduser' || role === 'admin';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}
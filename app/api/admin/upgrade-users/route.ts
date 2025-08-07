import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, payment } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Find users who have completed payments but are still 'user' role
    const usersToUpgrade = await db
      .select({
        userId: payment.userId,
        userRole: user.role,
        userEmail: user.email,
      })
      .from(payment)
      .innerJoin(user, eq(payment.userId, user.id))
      .where(and(
        eq(payment.status, 'completed'),
        eq(user.role, 'user')
      ));

    const upgradedUsers = [];

    for (const userData of usersToUpgrade) {
      await db
        .update(user)
        .set({
          role: 'paiduser',
          updatedAt: new Date(),
        })
        .where(eq(user.id, userData.userId));

      upgradedUsers.push({
        userId: userData.userId,
        email: userData.userEmail,
        oldRole: 'user',
        newRole: 'paiduser',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Upgraded ${upgradedUsers.length} users to paiduser status`,
      upgradedUsers,
    });
  } catch (error) {
    console.error('Error upgrading users:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade users' },
      { status: 500 }
    );
  }
}
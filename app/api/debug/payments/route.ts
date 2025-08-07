import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { payment, user } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's recent payments
    const userPayments = await db
      .select()
      .from(payment)
      .where(eq(payment.userId, session.user.id))
      .orderBy(desc(payment.createdAt))
      .limit(10);

    // Get user record
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      user: {
        id: userRecord?.id,
        email: userRecord?.email,
        role: userRecord?.role,
        stripeCustomerId: userRecord?.stripeCustomerId,
        subscriptionStatus: userRecord?.subscriptionStatus,
        updatedAt: userRecord?.updatedAt
      },
      sessionUser: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        stripeCustomerId: session.user.stripeCustomerId,
        subscriptionStatus: session.user.subscriptionStatus
      },
      payments: userPayments
    });
  } catch (error) {
    console.error('Debug payments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
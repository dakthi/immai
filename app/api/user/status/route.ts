import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, payment, userDocumentAccess } from '@/lib/db/schema';
import { eq, } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user details
    const [userDetails] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    // Get payment history
    const payments = await db
      .select()
      .from(payment)
      .where(eq(payment.userId, session.user.id));

    // Get document access
    const documentAccess = await db
      .select()
      .from(userDocumentAccess)
      .where(eq(userDocumentAccess.userId, session.user.id));

    const completedPayments = payments.filter(p => p.status === 'completed');
    const shouldBePaidUser = completedPayments.length > 0;

    return NextResponse.json({
      user: {
        id: userDetails.id,
        email: userDetails.email,
        role: userDetails.role,
        stripeCustomerId: userDetails.stripeCustomerId,
        subscriptionStatus: userDetails.subscriptionStatus,
      },
      payments: {
        total: payments.length,
        completed: completedPayments.length,
        pending: payments.filter(p => p.status === 'pending').length,
        failed: payments.filter(p => p.status === 'failed').length,
      },
      documentAccess: {
        total: documentAccess.length,
        purchased: documentAccess.filter(d => d.accessType === 'purchased').length,
        free: documentAccess.filter(d => d.accessType === 'free').length,
      },
      analysis: {
        shouldBePaidUser,
        needsUpgrade: shouldBePaidUser && userDetails.role === 'user',
      },
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user status' },
      { status: 500 }
    );
  }
}
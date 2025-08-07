import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, payment } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentIntentId } = await req.json();
    
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    // Find the payment record
    const [paymentRecord] = await db
      .select()
      .from(payment)
      .where(eq(payment.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    if (!paymentRecord) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Update payment status to completed
    await db
      .update(payment)
      .set({
        status: 'completed',
        paymentDate: new Date(),
      })
      .where(eq(payment.id, paymentRecord.id));

    // Get user record
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, paymentRecord.userId))
      .limit(1);

    if (!userRecord) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    let upgraded = false;
    if (userRecord.role === 'user') {
      await db
        .update(user)
        .set({
          role: 'paiduser',
          updatedAt: new Date(),
        })
        .where(eq(user.id, paymentRecord.userId));
      
      upgraded = true;
    }

    return NextResponse.json({
      message: 'Upgrade processed',
      paymentRecord,
      userRecord,
      upgraded,
      newRole: upgraded ? 'paiduser' : userRecord.role
    });
  } catch (error) {
    console.error('Debug trigger upgrade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
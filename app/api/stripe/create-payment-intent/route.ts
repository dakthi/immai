import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createPaymentIntent, createStripeCustomer } from '@/lib/stripe';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency = 'usd' } = await req.json();

    if (!amount || amount < 50) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    let customerId = session.user.stripeCustomerId;

    if (!customerId) {
      const customer = await createStripeCustomer(
        session.user.email!,
        session.user.name || undefined
      );
      customerId = customer.id;

      await db
        .update(user)
        .set({ stripeCustomerId: customerId })
        .where(eq(user.id, session.user.id));
    }

    const paymentIntent = await createPaymentIntent(amount, customerId, currency);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
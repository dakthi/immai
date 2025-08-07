import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createPaymentIntent, createStripeCustomer } from '@/lib/stripe';
import { db } from '@/lib/db';
import { user, payment } from '@/lib/db/schema';
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

    // Create payment record for subscription/pro upgrade
    const paymentData = {
      userId: session.user.id,
      documentId: null, // This is for pro subscription, not a specific document
      paymentType: 'package' as const, // Using 'package' for pro subscriptions
      stripePaymentIntentId: paymentIntent.id,
      amount: (amount / 100).toFixed(2),
      currency: currency.toUpperCase(),
      status: 'pending' as const,
    };
    
    console.log('Creating payment record:', paymentData);
    
    await db.insert(payment).values(paymentData);
    
    console.log(`✅ Payment record created for user ${session.user.id} with Stripe payment intent ${paymentIntent.id}`);

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
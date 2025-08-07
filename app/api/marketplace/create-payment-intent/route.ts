import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { createPaymentIntent, createStripeCustomer } from '@/lib/stripe';
import { db } from '@/lib/db';
import { user, documentLibrary, payment } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, amount } = await req.json();

    if (!documentId || !amount) {
      return NextResponse.json({ error: 'Missing document ID or amount' }, { status: 400 });
    }

    // Verify document exists and is not free
    const [document] = await db
      .select()
      .from(documentLibrary)
      .where(and(
        eq(documentLibrary.id, documentId),
        eq(documentLibrary.isActive, true)
      ))
      .limit(1);

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.isFree) {
      return NextResponse.json({ error: 'Document is free' }, { status: 400 });
    }

    // Verify amount matches document price
    const expectedAmount = Math.round(parseFloat(document.price || '0') * 100);
    if (amount !== expectedAmount) {
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

    const paymentIntent = await createPaymentIntent(amount, customerId, 'usd');

    // Create payment record
    await db.insert(payment).values({
      userId: session.user.id,
      documentId: documentId,
      paymentType: 'document',
      stripePaymentIntentId: paymentIntent.id,
      amount: (amount / 100).toFixed(2),
      currency: 'USD',
      status: 'pending',
    });

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
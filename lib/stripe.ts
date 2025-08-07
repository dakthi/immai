import Stripe from 'stripe';
import { db } from '@/lib/db';
import { user, payment } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export async function createStripeCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
  });
  return customer;
}

export async function createPaymentIntent(amount: number, customerId?: string, currency = 'usd') {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

export async function createSubscription(customerId: string, priceId: string) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });

  return subscription;
}

export async function updateUserToPaid(userId: string, stripeCustomerId: string, subscriptionId?: string) {
  await db
    .update(user)
    .set({
      role: 'paiduser',
      stripeCustomerId,
      subscriptionId,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}

export async function updateUserSubscriptionStatus(userId: string, status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | 'unpaid') {
  // Check if user has any completed payments
  const hasCompletedPayments = await db
    .select({ count: payment.id })
    .from(payment)
    .where(and(
      eq(payment.userId, userId),
      eq(payment.status, 'completed')
    ))
    .limit(1);

  // Only downgrade role if user has no completed payments
  // Users who have made any payment should stay as 'paiduser'
  const shouldMaintainPaidStatus = hasCompletedPayments.length > 0;
  
  await db
    .update(user)
    .set({
      subscriptionStatus: status,
      role: status === 'active' ? 'paiduser' : (shouldMaintainPaidStatus ? 'paiduser' : 'user'),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
}
import { NextRequest, NextResponse } from 'next/server';
import { stripe, updateUserToPaid, updateUserSubscriptionStatus } from '@/lib/stripe';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const [userRecord] = await db
          .select()
          .from(user)
          .where(eq(user.stripeCustomerId, customerId))
          .limit(1);

        if (userRecord) {
          await updateUserToPaid(
            userRecord.id,
            customerId,
            subscription.id
          );
          console.log(`Updated user ${userRecord.id} to paid status`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const [userRecord] = await db
          .select()
          .from(user)
          .where(eq(user.stripeCustomerId, customerId))
          .limit(1);

        if (userRecord) {
          await updateUserSubscriptionStatus(userRecord.id, 'canceled');
          console.log(`Canceled subscription for user ${userRecord.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        const [userRecord] = await db
          .select()
          .from(user)
          .where(eq(user.stripeCustomerId, customerId))
          .limit(1);

        if (userRecord) {
          await updateUserSubscriptionStatus(userRecord.id, 'past_due');
          console.log(`Payment failed for user ${userRecord.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
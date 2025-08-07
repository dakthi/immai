import { NextRequest, NextResponse } from 'next/server';
import { stripe, updateUserToPaid, updateUserSubscriptionStatus } from '@/lib/stripe';
import { db } from '@/lib/db';
import { user, payment, userDocumentAccess, documentLibrary } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

        // Handle document purchases
        const [paymentRecord] = await db
          .select()
          .from(payment)
          .where(eq(payment.stripePaymentIntentId, paymentIntent.id))
          .limit(1);

        if (paymentRecord && paymentRecord.documentId) {
          // Update payment status
          await db
            .update(payment)
            .set({
              status: 'completed',
              paymentDate: new Date(),
            })
            .where(eq(payment.id, paymentRecord.id));

          // Grant document access
          const existingAccess = await db
            .select()
            .from(userDocumentAccess)
            .where(and(
              eq(userDocumentAccess.userId, paymentRecord.userId),
              eq(userDocumentAccess.documentId, paymentRecord.documentId)
            ))
            .limit(1);

          if (existingAccess.length === 0) {
            await db.insert(userDocumentAccess).values({
              userId: paymentRecord.userId,
              documentId: paymentRecord.documentId,
              paymentId: paymentRecord.id,
              accessType: 'purchased',
              downloadCount: 0,
            });

            // Increment download count for the document
            await db.execute(
              `UPDATE "DocumentLibrary" SET "downloadCount" = "downloadCount" + 1 WHERE id = '${paymentRecord.documentId}'`
            );

            console.log(`Granted access to document ${paymentRecord.documentId} for user ${paymentRecord.userId}`);
          }
        }
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
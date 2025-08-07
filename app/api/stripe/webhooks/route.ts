import { type NextRequest, NextResponse } from 'next/server';
import { stripe, updateUserToPaid, updateUserSubscriptionStatus } from '@/lib/stripe';
import { db } from '@/lib/db';
import { user, payment, userDocumentAccess, } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
}
const validWebhookSecret: string = webhookSecret;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, validWebhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        // Handle document purchases and pro subscriptions
        console.log(`Looking for payment record with Stripe payment intent ID: ${paymentIntent.id}`);
        
        const [paymentRecord] = await db
          .select()
          .from(payment)
          .where(eq(payment.stripePaymentIntentId, paymentIntent.id))
          .limit(1);

        if (paymentRecord) {
          console.log(`Found payment record:`, {
            id: paymentRecord.id,
            userId: paymentRecord.userId,
            documentId: paymentRecord.documentId,
            paymentType: paymentRecord.paymentType,
            status: paymentRecord.status
          });
          // Update payment status
          await db
            .update(payment)
            .set({
              status: 'completed',
              paymentDate: new Date(),
            })
            .where(eq(payment.id, paymentRecord.id));

          // Grant document access (only for document purchases)
          if (paymentRecord.documentId) {
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

              console.log(`Granted access to document ${paymentRecord.documentId} for user ${paymentRecord.userId}`);
            }
          } else {
            // This is a pro subscription payment
            console.log(`Completed pro subscription payment for user ${paymentRecord.userId}`);
          }

          // Check if user should be upgraded to paiduser
          // If user has made any successful payment, upgrade them
          const [userRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, paymentRecord.userId))
            .limit(1);

          console.log(`User record found:`, {
            id: userRecord?.id,
            email: userRecord?.email,
            currentRole: userRecord?.role
          });

          if (userRecord && userRecord.role === 'user') {
            await db
              .update(user)
              .set({
                role: 'paiduser',
                updatedAt: new Date(),
              })
              .where(eq(user.id, paymentRecord.userId));

            console.log(`✅ Successfully upgraded user ${paymentRecord.userId} from 'user' to 'paiduser' status`);
          } else if (userRecord) {
            console.log(`User ${paymentRecord.userId} already has role: ${userRecord.role}, no upgrade needed`);
          } else {
            console.error(`❌ User record not found for userId: ${paymentRecord.userId}`);
          }
        } else {
          console.log(`❌ No payment record found for Stripe payment intent ID: ${paymentIntent.id}`);
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
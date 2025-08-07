import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user, payment, userDocumentAccess } from '@/lib/db/schema';
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

    console.log(`🔄 Simulating webhook for payment intent: ${paymentIntentId}`);

    // Simulate the exact webhook logic
    const [paymentRecord] = await db
      .select()
      .from(payment)
      .where(eq(payment.stripePaymentIntentId, paymentIntentId))
      .limit(1);

    if (paymentRecord) {
      console.log(`✅ Found payment record:`, {
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

      console.log(`✅ Updated payment status to completed`);

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

          console.log(`✅ Granted access to document ${paymentRecord.documentId}`);
        }
      } else {
        console.log(`✅ This is a pro subscription payment`);
      }

      // Check if user should be upgraded to paiduser
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, paymentRecord.userId))
        .limit(1);

      console.log(`👤 User record found:`, {
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
        
        return NextResponse.json({
          success: true,
          message: 'User upgraded successfully',
          before: { role: 'user' },
          after: { role: 'paiduser' },
          paymentRecord,
          userRecord: { ...userRecord, role: 'paiduser' }
        });
      } else if (userRecord) {
        console.log(`ℹ️ User ${paymentRecord.userId} already has role: ${userRecord.role}, no upgrade needed`);
        
        return NextResponse.json({
          success: true,
          message: 'No upgrade needed',
          currentRole: userRecord.role,
          paymentRecord,
          userRecord
        });
      } else {
        console.error(`❌ User record not found for userId: ${paymentRecord.userId}`);
        
        return NextResponse.json({
          success: false,
          error: 'User record not found',
          paymentRecord
        }, { status: 404 });
      }
    } else {
      console.log(`❌ No payment record found for Stripe payment intent ID: ${paymentIntentId}`);
      
      return NextResponse.json({
        success: false,
        error: 'Payment record not found',
        paymentIntentId
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Simulate webhook error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
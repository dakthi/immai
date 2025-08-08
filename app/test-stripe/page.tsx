import { auth } from '@/app/(auth)/auth';
import { StripePayment } from '@/components/stripe-payment';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';

export const revalidate = 0;

export default async function TestStripePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const params = await searchParams;
  const isSuccess = params.success === 'true';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Stripe Integration Test</h1>
      
      {isSuccess && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-lg font-semibold text-green-600 mb-2">
            ✅ Payment Successful!
          </h2>
          <p className="text-sm text-green-700">
            Your payment was processed successfully. Your account will be upgraded shortly.
          </p>
        </Card>
      )}
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">User Info</h2>
        <div className="space-y-2 text-sm">
          <p><strong>ID:</strong> {session.user.id}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Role:</strong> {session.user.role}</p>
          <p><strong>Type:</strong> {session.user.type}</p>
          <p><strong>Stripe Customer ID:</strong> {session.user.stripeCustomerId || 'Not set'}</p>
          <p><strong>Subscription Status:</strong> {session.user.subscriptionStatus || 'Not set'}</p>
        </div>
      </Card>

      {session.user.role !== 'paiduser' && session.user.role !== 'admin' && (
        <StripePayment 
          amount={999} // $9.99
        />
      )}

      {(session.user.role === 'paiduser' || session.user.role === 'admin') && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-green-600 mb-2">
            ✅ You have paid access!
          </h2>
          <p className="text-sm text-gray-600">
            You can access premium features.
          </p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Debug Tools</h2>
        <div className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>API Endpoints:</strong></p>
            <p>• GET /api/debug/payments - View your payment history</p>
            <p>• POST /api/debug/trigger-upgrade - Manually trigger upgrade</p>
            <p>• POST /api/stripe/create-payment-intent</p>
            <p>• POST /api/stripe/webhooks</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
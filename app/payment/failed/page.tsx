import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; payment_intent?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const params = await searchParams;
  const error = params.error || 'Your payment could not be processed';
  const paymentIntentId = params.payment_intent;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="size-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t process your payment. Please try again.
        </p>
      </div>

      <Card className="p-6 bg-red-50 border-red-200">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Error Details
        </h2>
        <p className="text-sm text-red-700">
          {error}
        </p>
        {paymentIntentId && (
          <p className="text-xs text-red-600 mt-2">
            Payment ID: {paymentIntentId}
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">What can you do?</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="size-2 bg-blue-500 rounded-full mt-2" />
            <p>Check that your card details are correct</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="size-2 bg-blue-500 rounded-full mt-2" />
            <p>Ensure you have sufficient funds</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="size-2 bg-blue-500 rounded-full mt-2" />
            <p>Try a different payment method</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="size-2 bg-blue-500 rounded-full mt-2" />
            <p>Contact your bank if the problem persists</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-center space-x-4">
        <Link href="/test-stripe">
          <Button>Try Again</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
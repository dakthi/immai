import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SessionRefreshClient } from './session-refresh-client';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function PaymentSuccessPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <SessionRefreshClient />
      <div className="text-center">
        <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="size-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your payment. Your account has been upgraded.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">What&apos;s Next?</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <div className="size-2 bg-blue-500 rounded-full mt-2" />
            <p>Your account will be updated to Pro status within a few minutes</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="size-2 bg-blue-500 rounded-full mt-2" />
            <p>You&apos;ll receive a confirmation email shortly</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="size-2 bg-blue-500 rounded-full mt-2" />
            <p>All premium features are now available to you</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Account Details</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Current Role:</strong> {session.user.role}</p>
          <p><strong>Account Type:</strong> {session.user.type}</p>
          {session.user.stripeCustomerId && (
            <p><strong>Customer ID:</strong> {session.user.stripeCustomerId}</p>
          )}
          {session.user.subscriptionStatus && (
            <p><strong>Subscription Status:</strong> {session.user.subscriptionStatus}</p>
          )}
        </div>
      </Card>

      <div className="flex justify-center space-x-4">
        <Link href="/">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/test-stripe">
          <Button variant="outline">View Test Page</Button>
        </Link>
      </div>
    </div>
  );
}
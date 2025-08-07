'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DocumentLibrary } from '@/lib/db/schema';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not configured');
}

const stripePromise = loadStripe(stripePublicKey);

interface PaymentFormProps {
  clientSecret: string;
  documentId: string;
}

function PaymentForm({ clientSecret, documentId }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setIsLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/marketplace/document/${documentId}?purchased=true`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
    } else {
      // Payment succeeded, redirect to document page
      window.location.href = `/marketplace/document/${documentId}?purchased=true`;
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Complete Purchase'}
      </Button>
    </form>
  );
}

interface PurchaseFormProps {
  document: DocumentLibrary;
  userId: string;
}

export function PurchaseForm({ document, userId }: PurchaseFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/marketplace/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documentId: document.id,
          amount: Math.round(Number.parseFloat(document.price || '0') * 100) // Convert to cents
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const appearance = {
    theme: 'stripe' as const,
  };

  const options = {
    clientSecret: clientSecret || undefined,
    appearance,
  };

  if (!clientSecret) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              What you&apos;ll get:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Instant download access</li>
              <li>• Lifetime access to this document</li>
              <li>• Support for questions about the content</li>
            </ul>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <Button 
            onClick={createPaymentIntent} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Preparing payment...' : `Pay $${Number.parseFloat(document.price || '0').toFixed(2)}`}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Complete Payment ($${Number.parseFloat(document.price || '0').toFixed(2)})
      </h2>
      <Elements options={options} stripe={stripePromise}>
        <PaymentForm 
          clientSecret={clientSecret} 
          documentId={document.id}
        />
      </Elements>
    </Card>
  );
}
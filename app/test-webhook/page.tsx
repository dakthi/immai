'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestWebhookPage() {
  const [paymentIntentId, setPaymentIntentId] = useState('pi_3RtIJZAAGmdRUxBY0KGF2YFk');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/debug/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to test webhook', details: error });
    } finally {
      setLoading(false);
    }
  };

  const checkPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/payments');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to check payments', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Local Webhook Testing</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Simulate Stripe Webhook</h2>
        <p className="text-sm text-gray-600 mb-4">
          Since you&apos;re on localhost, Stripe webhooks can&apos;t reach your server. 
          Use this to simulate the webhook that should have fired after payment.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Payment Intent ID</label>
            <Input 
              value={paymentIntentId}
              onChange={(e) => setPaymentIntentId(e.target.value)}
              placeholder="pi_3RtIJZAAGmdRUxBY0KGF2YFk"
            />
          </div>
          
          <div className="flex space-x-4">
            <Button onClick={testWebhook} disabled={loading}>
              {loading ? 'Processing...' : 'Simulate Webhook'}
            </Button>
            <Button variant="outline" onClick={checkPayments} disabled={loading}>
              Check Payment Status
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Result</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-600 font-semibold">✅ Success!</p>
              <p className="text-sm text-green-700 mt-1">
                User should now be upgraded. Try refreshing the page or logging out/in to see the changes.
              </p>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">For Production</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Stripe Dashboard:</strong></p>
          <p>• Go to Developers → Webhooks</p>
          <p>• Add endpoint: <code>https://yourdomain.com/api/stripe/webhooks</code></p>
          <p>• Select event: <code>payment_intent.succeeded</code></p>
          <p>• Copy webhook signing secret to <code>STRIPE_WEBHOOK_SECRET</code></p>
        </div>
      </Card>
    </div>
  );
}
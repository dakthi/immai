'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface UpgradeUsersButtonProps {
  count: number;
}

export function UpgradeUsersButton({ count }: UpgradeUsersButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/upgrade-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        // Reload page after 2 seconds to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upgrade failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <div className="text-center">
        {result.success ? (
          <div className="text-green-600">
            ✅ Successfully upgraded {result.upgradedUsers?.length || 0} users!
            <div className="text-xs text-gray-600 mt-1">
              Page will refresh automatically...
            </div>
          </div>
        ) : (
          <div className="text-red-600">
            ❌ Error: {result.error}
          </div>
        )}
      </div>
    );
  }

  return (
    <Button 
      onClick={handleUpgrade}
      disabled={isLoading}
      className="bg-yellow-600 hover:bg-yellow-700"
    >
      {isLoading ? 'Upgrading...' : `Upgrade ${count} Users`}
    </Button>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function SessionRefreshClient() {
  const { update: updateSession, data: session } = useSession();
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    console.log('Payment success: Current session:', session?.user);
    
    // Refresh session data to get the updated user role
    const refreshSession = async () => {
      console.log('Refreshing session...');
      await updateSession();
      console.log('Session refreshed');
    };
    
    refreshSession();
    
    // Try to refresh a few times in case webhook takes time
    const interval = setInterval(() => {
      if (refreshCount < 3) {
        console.log(`Refreshing session again (attempt ${refreshCount + 1})`);
        refreshSession();
        setRefreshCount(prev => prev + 1);
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [updateSession, refreshCount, session]);

  return null;
}
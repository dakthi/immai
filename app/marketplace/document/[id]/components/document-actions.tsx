'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DocumentLibrary } from '@/lib/db/schema';
import type { Session } from 'next-auth';
import Link from 'next/link';

interface DocumentActionsProps {
  document: DocumentLibrary;
  hasAccess: boolean;
  currentUser?: Session['user'];
}

export function DocumentActions({ document, hasAccess, currentUser }: DocumentActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFreeAccess = async () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/marketplace/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentId: document.id, 
          accessType: 'free' 
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        throw new Error('Failed to grant access');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Failed to access document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/marketplace/download/${document.id}`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = document.fileName;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Actions</h2>
      <div className="space-y-3">
        {hasAccess ? (
          <>
            <Button 
              onClick={handleDownload} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Downloading...' : '⬇️ Download'}
            </Button>
            <p className="text-xs text-gray-600 text-center">
              You have access to this document
            </p>
          </>
        ) : (
          <>
            {document.isFree ? (
              <>
                <Button 
                  onClick={handleFreeAccess} 
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Processing...' : '🎉 Get Free Access'}
                </Button>
                <p className="text-xs text-gray-600 text-center">
                  This document is free to download
                </p>
              </>
            ) : (
              <>
                <Link href={`/marketplace/purchase/${document.id}`}>
                  <Button className="w-full" size="lg">
                    💳 Purchase for ${parseFloat(document.price || '0').toFixed(2)}
                  </Button>
                </Link>
                <p className="text-xs text-gray-600 text-center">
                  One-time purchase • Lifetime access
                </p>
              </>
            )}

            {!currentUser && (
              <div className="border-t pt-3 mt-3">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Login to Access
                  </Button>
                </Link>
              </div>
            )}

            {currentUser && currentUser.role === 'user' && (
              <div className="border-t pt-3 mt-3">
                <Link href="/test-stripe">
                  <Button variant="outline" className="w-full" size="sm">
                    Upgrade to Pro
                  </Button>
                </Link>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Pro users can upload documents
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
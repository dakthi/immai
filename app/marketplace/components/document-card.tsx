'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DocumentLibrary } from '@/lib/db/schema';
import type { Session } from 'next-auth';
import Link from 'next/link';

interface DocumentCardProps {
  document: DocumentLibrary;
  hasAccess: boolean;
  currentUser?: Session['user'];
}

export function DocumentCard({ document, hasAccess, currentUser }: DocumentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)}KB` : `${mb.toFixed(1)}MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }

    if (document.isFree) {
      // Grant free access
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
    } else {
      // Redirect to purchase page
      window.location.href = `/marketplace/purchase/${document.id}`;
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getFileIcon(document.fileType)}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-sm line-clamp-2">{document.title}</h3>
            </div>
          </div>
          {document.isFree ? (
            <Badge variant="secondary" className="text-xs">Free</Badge>
          ) : (
            <Badge className="text-xs">${document.price}</Badge>
          )}
        </div>

        {document.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-3">
            {document.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{formatFileSize(document.fileSize)}</span>
          <span>{document.downloadCount} downloads</span>
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {document.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {hasAccess ? (
            <>
              <Button 
                size="sm" 
                onClick={handleDownload} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Downloading...' : 'Download'}
              </Button>
              <Link href={`/marketplace/document/${document.id}`}>
                <Button size="sm" variant="outline">View</Button>
              </Link>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                onClick={handlePurchase} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : document.isFree ? 'Get Free' : 'Purchase'}
              </Button>
              <Link href={`/marketplace/document/${document.id}`}>
                <Button size="sm" variant="outline">Preview</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
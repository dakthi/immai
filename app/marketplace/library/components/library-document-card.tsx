'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DocumentLibrary, UserDocumentAccess } from '@/lib/db/schema';
import Link from 'next/link';

interface LibraryDocumentCardProps {
  document: DocumentLibrary;
  access: UserDocumentAccess;
}

export function LibraryDocumentCard({ document, access }: LibraryDocumentCardProps) {
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

  const getAccessTypeBadge = () => {
    switch (access.accessType) {
      case 'purchased':
        return <Badge className="text-xs">Purchased</Badge>;
      case 'free':
        return <Badge variant="secondary" className="text-xs">Free</Badge>;
      case 'admin':
        return <Badge variant="outline" className="text-xs">Admin</Badge>;
      default:
        return null;
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
          {getAccessTypeBadge()}
        </div>

        {document.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {document.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{formatFileSize(document.fileSize)}</span>
          <span>{access.downloadCount} downloads</span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          <div>Added: {new Date(access.grantedAt).toLocaleDateString()}</div>
          {access.lastAccessedAt && (
            <div>Last used: {new Date(access.lastAccessedAt).toLocaleDateString()}</div>
          )}
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
        </div>
      </div>
    </Card>
  );
}
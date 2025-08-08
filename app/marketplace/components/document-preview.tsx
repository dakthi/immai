'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import type { DocumentLibrary } from '@/lib/db/schema';

interface DocumentPreviewProps {
  document: DocumentLibrary;
  hasAccess: boolean;
}

export function DocumentPreview({ document, hasAccess }: DocumentPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getPreviewContent = () => {
    const fileType = document.fileType.toLowerCase();
    
    // For PDFs, we can show an embedded preview
    if (fileType.includes('pdf') && hasAccess) {
      return (
        <div className="w-full h-96">
          <iframe
            src={`${document.filePath}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&scrollbar=0`}
            width="100%"
            height="100%"
            title={`Preview of ${document.title}`}
            className="border rounded-lg"
          />
        </div>
      );
    }

    // For images, show the actual image
    if (fileType.includes('image') && hasAccess && !imageError) {
      return (
        <div className="w-full max-h-96 overflow-hidden flex justify-center">
          <Image
            src={document.filePath}
            alt={document.title}
            width={800}
            height={400}
            className="max-w-full max-h-96 object-contain rounded-lg"
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    // For other file types or when no access, show file info
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">
          {getFileIcon(document.fileType)}
        </div>
        <h3 className="text-lg font-semibold mb-2">{document.title}</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>File Type: {getFileTypeDisplay(document.fileType)}</p>
          <p>Size: {formatFileSize(document.fileSize)}</p>
          <p>Downloads: {document.downloadCount}</p>
          {document.description && (
            <p className="mt-4 text-gray-700 max-w-md mx-auto">
              {document.description}
            </p>
          )}
        </div>
        {!hasAccess && (
          <div className="mt-4">
            <Badge variant="secondary">
              Preview available after {document.isFree ? 'free access' : 'purchase'}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('image')) return '🖼️';
    return '📁';
  };

  const getFileTypeDisplay = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'PDF Document';
    if (type.includes('word') || type.includes('doc')) return 'Word Document';
    if (type.includes('excel') || type.includes('sheet')) return 'Excel Spreadsheet';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'PowerPoint Presentation';
    if (type.includes('image/jpeg') || type.includes('image/jpg')) return 'JPEG Image';
    if (type.includes('image/png')) return 'PNG Image';
    if (type.includes('image/gif')) return 'GIF Image';
    if (type.includes('image')) return 'Image';
    return fileType;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)}KB` : `${mb.toFixed(1)}MB`;
  };

  return (
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="size-4 mr-1" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{getFileIcon(document.fileType)}</span>
              {document.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {document.isFree ? (
                <Badge variant="secondary">Free</Badge>
              ) : (
                <Badge>${document.price}</Badge>
              )}
              {hasAccess && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`/api/marketplace/download/${document.id}`} target="_blank">
                    <Download className="size-4 mr-1" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </div>
          {document.category && (
            <Badge variant="outline" className="w-fit">
              {document.category}
            </Badge>
          )}
        </DialogHeader>
        
        <div className="mt-4">
          {getPreviewContent()}
        </div>

        {document.tags && document.tags.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {document.analyzedContent?.summary && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">AI Summary:</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {document.analyzedContent.summary}
            </p>
          </div>
        )}

        {document.analyzedContent?.keywords && document.analyzedContent.keywords.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Keywords:</h4>
            <div className="flex flex-wrap gap-1">
              {document.analyzedContent.keywords.map((keyword: string) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Uploaded:</strong> {new Date(document.createdAt).toLocaleDateString()}
            </div>
            <div>
              <strong>File Size:</strong> {formatFileSize(document.fileSize)}
            </div>
            <div>
              <strong>Downloads:</strong> {document.downloadCount}
            </div>
            <div>
              <strong>Format:</strong> {getFileTypeDisplay(document.fileType)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
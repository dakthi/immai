import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseForm } from './components/purchase-form';

async function getDocument(id: string) {
  const [document] = await db
    .select()
    .from(documentLibrary)
    .where(and(
      eq(documentLibrary.id, id),
      eq(documentLibrary.isActive, true)
    ))
    .limit(1);
  
  return document;
}

async function checkUserAccess(userId: string, documentId: string) {
  const [access] = await db
    .select()
    .from(userDocumentAccess)
    .where(and(
      eq(userDocumentAccess.userId, userId),
      eq(userDocumentAccess.documentId, documentId)
    ))
    .limit(1);
  
  return access;
}

export default async function PurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/login');
  }

  const document = await getDocument(id);

  if (!document) {
    redirect('/marketplace');
  }

  // Check if document is free
  if (document.isFree) {
    redirect(`/marketplace/document/${id}`);
  }

  // Check if user already has access
  const existingAccess = await checkUserAccess(session.user.id, id);
  if (existingAccess) {
    redirect(`/marketplace/document/${id}`);
  }

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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Purchase Document
        </h1>
        <p className="text-gray-600">
          Complete your purchase to download this document
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Document Details</h2>
          
          <div className="flex items-start space-x-4 mb-4">
            <span className="text-4xl">{getFileIcon(document.fileType)}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{document.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <span>{formatFileSize(document.fileSize)}</span>
                <span>{document.downloadCount} downloads</span>
              </div>
              {document.category && (
                <Badge variant="outline" className="mb-2">
                  {document.category}
                </Badge>
              )}
            </div>
          </div>

          {document.description && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-gray-600 text-sm">{document.description}</p>
            </div>
          )}

          {document.tags && document.tags.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                ${parseFloat(document.price || '0').toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        <PurchaseForm 
          document={document}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
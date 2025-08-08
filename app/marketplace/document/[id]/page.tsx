import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess, user as userTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DocumentActions } from './components/document-actions';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getDocument(id: string) {
  const result = await db
    .select({
      document: documentLibrary,
      uploader: {
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
      },
    })
    .from(documentLibrary)
    .leftJoin(userTable, eq(documentLibrary.uploadedBy, userTable.id))
    .where(and(
      eq(documentLibrary.id, id),
      eq(documentLibrary.isActive, true)
    ))
    .limit(1);
  
  return result[0];
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

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ purchased?: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const { purchased } = await searchParams;

  const result = await getDocument(id);

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
        <p className="text-gray-600 mb-4">The document you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/marketplace">
          <Button>Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const { document, uploader } = result;
  const userAccess = session?.user ? await checkUserAccess(session.user.id, id) : null;
  const hasAccess = Boolean(userAccess) || session?.user?.role === 'admin';

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
      {purchased === 'true' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            ✅ Purchase Successful!
          </h3>
          <p className="text-sm text-green-700">
            Thank you for your purchase. You can now download this document anytime.
          </p>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Link href="/marketplace" className="text-blue-600 hover:underline text-sm">
              ← Back to Marketplace
            </Link>
          </div>
          <div className="flex items-start space-x-4">
            <span className="text-5xl">{getFileIcon(document.fileType)}</span>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {document.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>{formatFileSize(document.fileSize)}</span>
                <span>{document.downloadCount} downloads</span>
                <span>Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          {document.isFree ? (
            <Badge variant="secondary" className="text-lg px-3 py-1">Free</Badge>
          ) : (
            <Badge className="text-lg px-3 py-1">${Number.parseFloat(document.price || '0').toFixed(2)}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {document.description && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{document.description}</p>
            </Card>
          )}

          {document.analyzedContent?.summary && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <p className="text-gray-700">{document.analyzedContent.summary}</p>
            </Card>
          )}

          {document.analyzedContent?.keywords && document.analyzedContent.keywords.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {document.analyzedContent.keywords.map((keyword: string) => (
                  <Badge key={keyword} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Document Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">File name:</span>
                <span className="font-medium">{document.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File size:</span>
                <span className="font-medium">{formatFileSize(document.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">File type:</span>
                <span className="font-medium">{document.fileType}</span>
              </div>
              {document.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <Badge variant="outline" className="text-xs">
                    {document.category}
                  </Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Downloads:</span>
                <span className="font-medium">{document.downloadCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Uploaded:</span>
                <span className="font-medium">
                  {new Date(document.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {uploader && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Uploaded by</h2>
              <div className="flex items-center space-x-3">
                <div className="size-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {uploader.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{uploader.name || 'Anonymous'}</div>
                  <div className="text-xs text-gray-600">{uploader.email}</div>
                </div>
              </div>
            </Card>
          )}

          {document.tags && document.tags.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag: string) => (
                  <Link key={tag} href={`/marketplace?search=${encodeURIComponent(tag)}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <DocumentActions 
            document={document}
            hasAccess={hasAccess}
            currentUser={session?.user}
          />
        </div>
      </div>
    </div>
  );
}
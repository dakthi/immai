import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { LibraryDocumentCard } from './components/library-document-card';

async function getUserDocuments(userId: string) {
  return await db
    .select({
      document: documentLibrary,
      access: userDocumentAccess,
    })
    .from(userDocumentAccess)
    .innerJoin(documentLibrary, eq(userDocumentAccess.documentId, documentLibrary.id))
    .where(eq(userDocumentAccess.userId, userId))
    .orderBy(desc(userDocumentAccess.grantedAt));
}

export default async function LibraryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userDocuments = await getUserDocuments(session.user.id);

  const stats = {
    total: userDocuments.length,
    purchased: userDocuments.filter(item => item.access.accessType === 'purchased').length,
    free: userDocuments.filter(item => item.access.accessType === 'free').length,
    totalDownloads: userDocuments.reduce((sum, item) => sum + item.access.downloadCount, 0),
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Document Library
          </h1>
          <p className="text-gray-600">
            Access all your purchased and free documents
          </p>
        </div>
        <Link href="/marketplace">
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            Browse Marketplace →
          </Badge>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.purchased}</div>
            <div className="text-sm text-gray-600">Purchased</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.free}</div>
            <div className="text-sm text-gray-600">Free</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalDownloads}</div>
            <div className="text-sm text-gray-600">Downloads</div>
          </div>
        </Card>
      </div>

      {userDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="size-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6">
            Start exploring the marketplace to find useful documents for your projects.
          </p>
          <Link href="/marketplace">
            <Badge className="cursor-pointer px-4 py-2">
              Explore Marketplace
            </Badge>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userDocuments.map((item) => (
            <LibraryDocumentCard
              key={item.document.id}
              document={item.document}
              access={item.access}
            />
          ))}
        </div>
      )}

      {session.user.role === 'user' && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Want to upload your own documents?
              </h3>
              <p className="text-sm text-blue-700">
                Upgrade to Pro to share your documents with the community and earn from downloads.
              </p>
            </div>
            <Link href="/test-stripe">
              <Badge className="cursor-pointer">
                Upgrade to Pro
              </Badge>
            </Link>
          </div>
        </Card>
      )}

      {session.user.role === 'paiduser' && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ You&apos;re a Paid User!
              </h3>
              <p className="text-sm text-green-700">
                You can now upload documents and access premium features.
              </p>
            </div>
            <Link href="/marketplace/upload">
              <Badge className="cursor-pointer bg-green-600">
                Upload Document
              </Badge>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
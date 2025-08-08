import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { LibraryDocumentCard } from './components/library-document-card';
import { BookOpen, Download, Star, TrendingUp, Search } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

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

async function getLibraryStats(userId: string) {
  const userDocs = await getUserDocuments(userId);
  
  const totalDocs = await db
    .select({ count: count() })
    .from(userDocumentAccess)
    .where(eq(userDocumentAccess.userId, userId));

  const recentDocs = userDocs.slice(0, 3);

  return {
    total: totalDocs[0]?.count || 0,
    recent: recentDocs
  };
}

export default async function LibraryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userDocuments = await getUserDocuments(session.user.id);
  const stats = await getLibraryStats(session.user.id);

  const libraryStats = {
    total: userDocuments.length,
    purchased: userDocuments.filter(item => item.access.accessType === 'purchased').length,
    free: userDocuments.filter(item => item.access.accessType === 'free').length,
    totalDownloads: userDocuments.reduce((sum, item) => sum + item.access.downloadCount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-none px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-4 py-2 mb-6">
            <BookOpen className="size-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">Personal Library</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Resource Library
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access all your downloaded and purchased resources in one organized place
          </p>
        </div>




        {/* Filter Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="size-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your library..."
                  className="border-0 outline-none bg-transparent text-gray-900 placeholder:text-gray-500 text-sm flex-1"
                />
              </div>
              <select className="text-sm border border-gray-200 rounded px-3 py-1.5">
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="word">Word</option>
                <option value="excel">Excel</option>
                <option value="powerpoint">PowerPoint</option>
                <option value="image">Images</option>
              </select>
              <select className="text-sm border border-gray-200 rounded px-3 py-1.5">
                <option value="">All Access</option>
                <option value="free">Free</option>
                <option value="purchased">Purchased</option>
              </select>
            </div>
          </div>
        </div>

        {userDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 size-32 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="size-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No resources yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Your library is empty. Start exploring to add your first resources.
            </p>
            <Button asChild>
              <Link href="/">Browse Available Resources</Link>
            </Button>
          </div>
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
      </div>
    </div>
  );
}
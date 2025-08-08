import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess } from '@/lib/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { DocumentCard } from './components/document-card';
import { SearchFilter } from './components/search-filter';
import { BookOpen, Download, Star, TrendingUp, Search, Filter } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getDocuments() {
  return await db
    .select()
    .from(documentLibrary)
    .where(eq(documentLibrary.isActive, true))
    .orderBy(desc(documentLibrary.createdAt));
}

async function getUserAccess(userId: string) {
  return await db
    .select({ documentId: userDocumentAccess.documentId })
    .from(userDocumentAccess)
    .where(eq(userDocumentAccess.userId, userId));
}

async function getResourceStats() {
  const totalDocs = await db
    .select({ count: count() })
    .from(documentLibrary)
    .where(eq(documentLibrary.isActive, true));

  const popularDocs = await db
    .select()
    .from(documentLibrary)
    .where(eq(documentLibrary.isActive, true))
    .orderBy(desc(documentLibrary.downloadCount))
    .limit(3);

  return {
    total: totalDocs[0]?.count || 0,
    popular: popularDocs
  };
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    search?: string; 
    category?: string; 
    type?: 'free' | 'paid'; 
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  
  const documents = await getDocuments();
  const stats = await getResourceStats();
  const userAccess = session?.user ? await getUserAccess(session.user.id) : [];
  const accessedDocumentIds = new Set(userAccess.map(access => access.documentId));

  // Filter documents based on search params
  let filteredDocuments = documents;

  if (params.search) {
    const searchTerm = params.search.toLowerCase();
    filteredDocuments = filteredDocuments.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.description?.toLowerCase().includes(searchTerm) ||
      doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
    );
  }

  if (params.category) {
    filteredDocuments = filteredDocuments.filter(doc => 
      doc.category === params.category
    );
  }

  if (params.type) {
    if (params.type === 'free') {
      filteredDocuments = filteredDocuments.filter(doc => doc.isFree);
    } else if (params.type === 'paid') {
      filteredDocuments = filteredDocuments.filter(doc => !doc.isFree);
    }
  }

  const categories = [...new Set(documents.map(doc => doc.category).filter((cat): cat is string => Boolean(cat)))];
  const freeDocuments = documents.filter(doc => doc.isFree).length;
  const paidDocuments = documents.filter(doc => !doc.isFree).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <BookOpen className="size-5" />
              <span className="text-sm font-medium">Resource Library</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Premium
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400">
                Resources
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Access high-quality documents, templates, and resources to accelerate your projects and learning
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-blue-200">Total Resources</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{freeDocuments}</div>
                <div className="text-sm text-blue-200">Free</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{paidDocuments}</div>
                <div className="text-sm text-blue-200">Premium</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-sm text-blue-200">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Popular Resources Section */}
        {stats.popular.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="size-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Trending Resources</h2>
                <p className="text-gray-600">Most downloaded and popular content</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.popular.map((doc, index) => (
                <Card key={doc.id} className="relative overflow-hidden border-0 shadow-lg">
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      #{index + 1}
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <div className="text-4xl mb-2">
                      {doc.fileType.includes('pdf') ? '📄' :
                       doc.fileType.includes('word') ? '📝' :
                       doc.fileType.includes('excel') ? '📊' :
                       doc.fileType.includes('powerpoint') ? '📽️' :
                       doc.fileType.includes('image') ? '🖼️' : '📁'}
                    </div>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="size-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{doc.downloadCount} downloads</span>
                      </div>
                      <Badge variant={doc.isFree ? "secondary" : "default"}>
                        {doc.isFree ? "Free" : `$${doc.price}`}
                      </Badge>
                    </div>
                    <Button asChild className="w-full mt-4" size="sm">
                      <Link href={`/marketplace/document/${doc.id}`}>
                        View Resource
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="size-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse All Resources</h2>
              <p className="text-gray-600">Find exactly what you need with our advanced search and filters</p>
            </div>
          </div>
          
          <SearchFilter categories={categories} />
        </div>

        {/* User Status Card */}
        {session?.user && (
          <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
                    <Star className="size-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Welcome back, {session.user.name || session.user.email}!</h3>
                    <p className="text-sm text-gray-600">
                      Account Status: <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        {session.user.role === 'paiduser' ? 'Pro Member' : 
                         session.user.role === 'admin' ? 'Administrator' : 'Free Member'}
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {session.user.role === 'user' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Unlock premium resources</p>
                      <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500">
                        <Link href="/test-stripe">Upgrade to Pro</Link>
                      </Button>
                    </div>
                  )}
                  {(session.user.role === 'paiduser' || session.user.role === 'admin') && (
                    <Button asChild variant="outline">
                      <Link href="/marketplace/library">My Library</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              hasAccess={accessedDocumentIds.has(document.id)}
              currentUser={session?.user}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 size-32 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="size-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              We couldn&apos;t find any resources matching your search criteria. Try adjusting your filters or check back later for new uploads.
            </p>
            <Button asChild variant="outline">
              <Link href="/marketplace">Browse All Resources</Link>
            </Button>
          </div>
        )}

        {/* Call to Action Section */}
        {!session?.user && (
          <Card className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-8 text-center">
              <div className="p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full size-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="size-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Full Access to All Resources</h3>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                Sign up for free to start downloading resources, or upgrade to Pro for unlimited access to premium content.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/register">Sign Up Free</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/test-stripe">Go Pro</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
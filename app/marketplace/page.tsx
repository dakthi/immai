import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DocumentCard } from './components/document-card';
import { SearchFilter } from './components/search-filter';

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

export default async function MarketplacePage({
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
  const totalDocuments = filteredDocuments.length;
  const freeDocuments = filteredDocuments.filter(doc => doc.isFree).length;
  const paidDocuments = filteredDocuments.filter(doc => !doc.isFree).length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Marketplace
          </h1>
          <p className="text-gray-600">
            Discover and download premium documents, templates, and resources
          </p>
        </div>
        
        {session?.user && (session.user.role === 'admin' || session.user.role === 'paiduser') && (
          <Link href="/marketplace/upload">
            <Button>Upload Document</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalDocuments}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{freeDocuments}</div>
            <div className="text-sm text-gray-600">Free</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{paidDocuments}</div>
            <div className="text-sm text-gray-600">Premium</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{categories.length}</div>
            <div className="text-sm text-gray-600">Categories</div>
          </div>
        </Card>
      </div>

      <SearchFilter categories={categories} />

      {session?.user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Your Account Status</h3>
              <p className="text-sm text-blue-700">
                Role: <Badge variant="outline">
                  {session.user.role === 'paiduser' ? 'Paid User' : 
                   session.user.role === 'admin' ? 'Admin' : 'Regular User'}
                </Badge>
                {session.user.role === 'user' && (
                  <span className="ml-2">
                    Upgrade to access premium features and upload documents
                  </span>
                )}
              </p>
            </div>
            {session.user.role === 'user' && (
              <Link href="/test-stripe">
                <Button size="sm">Upgrade to Pro</Button>
              </Link>
            )}
          </div>
        </div>
      )}

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

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or check back later for new uploads.
          </p>
        </div>
      )}
    </div>
  );
}
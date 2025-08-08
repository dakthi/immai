import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess, payment, downloadHistory } from '@/lib/db/schema';
import { eq, desc, count, sum, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Upload, TrendingUp, DollarSign, Download, Eye } from 'lucide-react';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getMarketplaceData() {
  // Get all documents in marketplace (admin manages all)
  const documents = await db
    .select()
    .from(documentLibrary)
    .orderBy(desc(documentLibrary.createdAt));

  // Get total downloads across all documents
  const documentIds = documents.map(doc => doc.id);
  
  let totalDownloads = 0;
  let totalRevenue = 0;
  
  if (documentIds.length > 0) {
    // Get download count
    const downloadStats = await db
      .select({
        count: count()
      })
      .from(downloadHistory)
      .innerJoin(userDocumentAccess, eq(downloadHistory.accessId, userDocumentAccess.id))
      .where(sql`${userDocumentAccess.documentId} IN ${documentIds}`);
    
    totalDownloads = downloadStats[0]?.count || 0;

    // Get revenue (from payments for this user's documents)
    const revenueStats = await db
      .select({
        total: sum(payment.amount)
      })
      .from(payment)
      .where(
        sql`${payment.documentId} IN ${documentIds} AND ${payment.status} = 'completed'`
      );
    
    totalRevenue = Number(revenueStats[0]?.total || '0');
  }

  // Get recent activity (recent downloads)
  let recentActivity: any[] = [];
  if (documentIds.length > 0) {
    recentActivity = await db
      .select({
        documentTitle: documentLibrary.title,
        downloadDate: downloadHistory.downloadedAt,
        documentId: downloadHistory.documentId,
      })
      .from(downloadHistory)
      .innerJoin(userDocumentAccess, eq(downloadHistory.accessId, userDocumentAccess.id))
      .innerJoin(documentLibrary, eq(userDocumentAccess.documentId, documentLibrary.id))
      .where(sql`${userDocumentAccess.documentId} IN ${documentIds}`)
      .orderBy(desc(downloadHistory.downloadedAt))
      .limit(10);
  }

  return {
    documents,
    totalDocuments: documents.length,
    totalDownloads,
    totalRevenue,
    recentActivity,
  };
}

export default async function SellerDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Only allow admin to access seller dashboard (admin is the only seller)
  if (session.user.role !== 'admin') {
    redirect('/marketplace');
  }

  const marketplaceData = await getMarketplaceData();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Marketplace Dashboard
          </h1>
          <p className="text-gray-600">
            Manage all marketplace documents, track performance, and monitor revenue
          </p>
        </div>
        
        <Link href="/marketplace/upload">
          <Button>
            <Upload className="size-4 mr-2" />
            Upload New Document
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{marketplaceData.totalDocuments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Upload className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{marketplaceData.totalDownloads}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Download className="size-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${marketplaceData.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="size-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Downloads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {marketplaceData.totalDocuments > 0 ? Math.round(marketplaceData.totalDownloads / marketplaceData.totalDocuments) : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="size-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Documents</span>
              <Badge variant="secondary">{marketplaceData.documents.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketplaceData.documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Upload className="size-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No documents uploaded yet</p>
                <Link href="/marketplace/upload">
                  <Button size="sm">Upload Your First Document</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {marketplaceData.documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{document.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{document.downloadCount} downloads</span>
                        <span>{document.isFree ? 'Free' : `$${document.price}`}</span>
                        <Badge 
                          variant={document.isActive ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {document.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/marketplace/document/${document.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {marketplaceData.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Download className="size-12 mx-auto mb-4 opacity-50" />
                <p>No recent downloads</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {marketplaceData.recentActivity.map((activity) => (
                  <div key={`${activity.documentId}-${activity.downloadDate}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.documentTitle}</p>
                      <p className="text-xs text-gray-500">
                        Downloaded {new Date(activity.downloadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Download className="size-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips to Increase Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📝 Better Titles</h3>
              <p className="text-sm text-blue-800">
                Use descriptive, keyword-rich titles that clearly explain what your document contains.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">🏷️ Smart Tags</h3>
              <p className="text-sm text-green-800">
                Add relevant tags to help users discover your content through search.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">💰 Competitive Pricing</h3>
              <p className="text-sm text-purple-800">
                Research similar documents to set competitive prices that provide value.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
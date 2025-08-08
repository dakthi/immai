import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, Plus, Settings, Code, ShoppingCart, DollarSign, Download, TrendingUp } from 'lucide-react';
import { db } from '@/lib/db';
import { documentLibrary, userDocumentAccess, payment, downloadHistory } from '@/lib/db/schema';
import { desc, count, sum, sql } from 'drizzle-orm';

async function getResourceStats() {
  const documents = await db.select().from(documentLibrary);
  
  let totalDownloads = 0;
  let totalRevenue = 0;
  
  if (documents.length > 0) {
    const downloadStats = await db
      .select({ count: count() })
      .from(downloadHistory);
    
    totalDownloads = downloadStats[0]?.count || 0;

    const revenueStats = await db
      .select({ total: sum(payment.amount) })
      .from(payment)
      .where(sql`${payment.status} = 'completed'`);
    
    totalRevenue = Number(revenueStats[0]?.total || '0');
  }

  const recentDocuments = await db
    .select()
    .from(documentLibrary)
    .orderBy(desc(documentLibrary.createdAt))
    .limit(5);

  return {
    totalDocuments: documents.length,
    totalDownloads,
    totalRevenue,
    recentDocuments,
    freeDocuments: documents.filter(doc => doc.isFree).length,
    paidDocuments: documents.filter(doc => !doc.isFree).length,
  };
}

export default async function AdminDashboard() {
  const resourceStats = await getResourceStats();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Marketplace Stats */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCart className="size-6" />
          Resource Library Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-600">{resourceStats.totalDocuments}</p>
                </div>
                <FileText className="size-8 text-blue-600" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {resourceStats.freeDocuments} free • {resourceStats.paidDocuments} paid
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                  <p className="text-2xl font-bold text-green-600">{resourceStats.totalDownloads}</p>
                </div>
                <Download className="size-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-yellow-600">${resourceStats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="size-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Downloads</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {resourceStats.totalDocuments > 0 
                      ? Math.round(resourceStats.totalDownloads / resourceStats.totalDocuments) 
                      : 0}
                  </p>
                </div>
                <TrendingUp className="size-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Core Admin Functions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Content Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage your custom prompts, templates, and documents
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/cms">
                Go to CMS
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              System Prompts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Customize core AI behavior and system prompts
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/system-prompts">
                Manage Prompts
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/cms/new">
                Add New Content
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/cms/quick-prompt">
                Create Sample Prompt
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Marketplace Documents */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Resource Library Documents</h2>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/marketplace/upload">
                <Plus className="size-4 mr-2" />
                Upload Document
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                View Resources
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4">
          {resourceStats.recentDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <ShoppingCart className="size-12 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground mb-4">No documents in resource library yet</p>
                <Button asChild>
                  <Link href="/marketplace/upload">Upload First Document</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            resourceStats.recentDocuments.map((document) => (
              <Card key={document.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {document.fileType.includes('pdf') ? '📄' :
                         document.fileType.includes('word') ? '📝' :
                         document.fileType.includes('excel') ? '📊' :
                         document.fileType.includes('powerpoint') ? '📽️' :
                         document.fileType.includes('image') ? '🖼️' : '📁'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{document.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{document.downloadCount} downloads</span>
                          <span>{document.isFree ? 'Free' : `$${document.price}`}</span>
                          <span>
                            {new Date(document.createdAt).toLocaleDateString()}
                          </span>
                          {document.category && (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {document.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        document.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {document.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/marketplace/document/${document.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {document.description && (
                    <p className="text-sm text-gray-600 mt-2 ml-12">
                      {document.description.length > 100 
                        ? `${document.description.substring(0, 100)}...` 
                        : document.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {resourceStats.recentDocuments.length > 0 && (
          <div className="text-center mt-4">
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                View All Documents ({resourceStats.totalDocuments})
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
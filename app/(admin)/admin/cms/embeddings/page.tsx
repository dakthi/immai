import { getCMSContent } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Zap, Database } from 'lucide-react';
import { RegenerateAllButton, RegenerateButton } from './regenerate-buttons';


export default async function EmbeddingsPage() {
  const content = await getCMSContent();
  
  const withEmbeddings = content.filter(item => item.embedding);
  const withoutEmbeddings = content.filter(item => !item.embedding);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Embedding Management</h1>
        <RegenerateAllButton />
      </div>

      <div className="grid gap-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{content.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Database className="w-4 h-4" />
                With Embeddings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{withEmbeddings.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Missing Embeddings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{withoutEmbeddings.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {withoutEmbeddings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            Content Missing Embeddings
          </h2>
          <div className="space-y-3">
            {withoutEmbeddings.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.type} • {item.slug}
                      </p>
                    </div>
                    <RegenerateButton contentId={item.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Content with Embeddings ({withEmbeddings.length})
        </h2>
        <div className="space-y-3">
          {withEmbeddings.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.type} • {item.slug}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Embedding generated
                    </p>
                  </div>
                  <RegenerateButton contentId={item.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
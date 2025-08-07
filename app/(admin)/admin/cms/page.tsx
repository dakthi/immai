import { getCMSContent } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Edit, FileText, Settings, Code, File } from 'lucide-react';

const typeIcons = {
  prompt: Code,
  template: File,
  document: FileText,
  config: Settings,
};

export default async function CMSPage() {
  const content = await getCMSContent();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Content Management</h1>
        <Button asChild>
          <Link href="/admin/cms/new">
            <Plus className="size-4 mr-2" />
            Add Content
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {content.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No content found</p>
              <Button asChild>
                <Link href="/admin/cms/new">Create your first content</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          content.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-5" />
                      <CardTitle>{item.title}</CardTitle>
                      <span className="text-sm bg-secondary px-2 py-1 rounded">
                        {item.type}
                      </span>
                      {!item.isActive && (
                        <span className="text-sm bg-muted px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/cms/${item.id}/edit`}>
                          <Edit className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Slug: {item.slug}
                  </p>
                  {item.category && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Category: {item.category}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-primary/10 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm line-clamp-3">{item.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated: {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
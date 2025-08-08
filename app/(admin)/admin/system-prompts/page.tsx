import { getSystemPromptsFromCMS, seedDefaultSystemPrompts } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Edit, Settings, Code, FileText, Wand2 } from 'lucide-react';

const promptTypeIcons = {
  'system-main': Settings,
  'system-code': Code,
  'system-sheet': FileText,
  'system-artifacts': Wand2,
};

const promptTypes = [
  { key: 'system-main', name: 'Main System Prompt', description: 'Core AI assistant personality and behavior' },
  { key: 'system-code', name: 'Code Generation', description: 'Python code generation instructions' },
  { key: 'system-sheet', name: 'Spreadsheet Creation', description: 'CSV/spreadsheet generation instructions' },
  { key: 'system-artifacts', name: 'Artifacts', description: 'Document and artifact creation instructions' },
];

export default async function SystemPromptsPage() {
  const systemPrompts = await getSystemPromptsFromCMS();

  // Create a map for easy lookup
  const promptMap = new Map(systemPrompts.map(p => [p.slug, p]));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Prompts</h1>
          <p className="text-muted-foreground mt-2">
            Customize the core AI behavior and functionality prompts
          </p>
        </div>
        <div className="flex gap-2">
          <form action={seedDefaultSystemPrompts}>
            <Button type="submit" variant="outline">
              <Settings className="size-4 mr-2" />
              Reset to Defaults
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4">
        {promptTypes.map((promptType) => {
          const existingPrompt = promptMap.get(promptType.key);
          const Icon = promptTypeIcons[promptType.key as keyof typeof promptTypeIcons];
          
          return (
            <Card key={promptType.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="size-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{promptType.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {promptType.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {existingPrompt ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            existingPrompt.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {existingPrompt.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/system-prompts/${existingPrompt.id}/edit`}>
                            <Edit className="size-4" />
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/system-prompts/new?type=${promptType.key}`}>
                          <Plus className="size-4 mr-2" />
                          Create
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {existingPrompt && (
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preview:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded border-l-2 border-primary/20 line-clamp-3">
                      {existingPrompt.content}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Updated: {new Date(existingPrompt.updatedAt).toLocaleDateString()}</span>
                      {existingPrompt.category && <span>Category: {existingPrompt.category}</span>}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            How System Prompts Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🎯 Main System Prompt</h4>
              <p className="text-muted-foreground">
                Defines the core personality and behavior of your AI assistant. This is used for all general conversations.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">💻 Code Generation Prompt</h4>
              <p className="text-muted-foreground">
                Used when the AI generates Python code snippets. Defines coding standards, practices, and output format.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">📊 Spreadsheet Prompt</h4>
              <p className="text-muted-foreground">
                Used when creating CSV files or spreadsheets. Defines data structure and formatting guidelines.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">✨ Artifacts Prompt</h4>
              <p className="text-muted-foreground">
                Used for document creation and other artifacts. Currently disabled but ready for future features.
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-4">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> Only active prompts are used. Inactive prompts fall back to system defaults.
                Use the &ldquo;Reset to Defaults&rdquo; button to restore original prompts if needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
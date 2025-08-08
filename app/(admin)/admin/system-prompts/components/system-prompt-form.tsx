'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSystemPrompt, updateSystemPrompt, deleteSystemPrompt } from '../actions';
import type { SystemPrompt } from '@/lib/db/schema';
import { Trash2, Info } from 'lucide-react';
import { deleteCMSContent } from '../../cms/actions';

interface SystemPromptFormProps {
  initialData?: Partial<SystemPrompt>;
}

export function SystemPromptForm({ initialData }: SystemPromptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    content: initialData?.content || '',
    category: initialData?.category || 'System Core',
    tags: '', // SystemPrompts don't have tags
    isActive: initialData?.isActive ?? true,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: !initialData ? generateSlug(title) : prev.slug, // Only auto-generate for new prompts
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        isActive: formData.isActive,
      };

      if (initialData?.id) {
        await updateSystemPrompt(initialData.id, data);
      } else {
        await createSystemPrompt({
          ...data,
          slug: formData.slug,
        });
      }

      router.push('/admin/system-prompts');
    } catch (error) {
      console.error('Error saving system prompt:', error);
      alert('Error saving prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    
    if (confirm('Are you sure you want to delete this system prompt? This will revert to the default behavior.')) {
      setLoading(true);
      try {
        await deleteSystemPrompt(initialData.id);
        router.push('/admin/system-prompts');
      } catch (error) {
        console.error('Error deleting system prompt:', error);
        alert('Error deleting prompt. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="size-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-900">System Prompt Guidelines</p>
              <ul className="text-blue-800 space-y-1 list-disc list-inside">
                <li>Be clear and specific about the AI&apos;s role and behavior</li>
                <li>Use natural language that defines personality and capabilities</li>
                <li>Include language preferences (Vietnamese/English)</li>
                <li>Set clear boundaries and limitations</li>
                <li>Only one active prompt per category is used</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{initialData?.id ? 'Edit System Prompt' : 'Create System Prompt'}</CardTitle>
            {initialData?.id && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Prompt Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Main System Prompt"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (System ID)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., system-main"
                  required
                  disabled={!!initialData?.id} // Don't allow changing slug for existing prompts
                />
                {initialData?.id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Slug cannot be changed for existing prompts
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., System Core"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="system, core, main"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="content" className="text-base font-semibold">
                Prompt Content
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                This content will be used as the system prompt for the AI. Write clear instructions about the AI&apos;s role, behavior, and capabilities.
              </p>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={20}
                className="font-mono text-sm"
                required
                placeholder="You are a helpful AI assistant. Your role is to..."
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="size-4"
              />
              <Label htmlFor="isActive" className="font-medium">
                Active (Use this prompt)
              </Label>
              <p className="text-sm text-muted-foreground">
                Only active prompts are used by the system
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (initialData?.id ? 'Update Prompt' : 'Create Prompt')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/system-prompts')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
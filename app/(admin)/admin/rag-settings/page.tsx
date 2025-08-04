'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RAGSettings {
  threshold: number;
  maxResults: number;
  maxExcerpts: number;
  temperature: number;
  minThreshold: number;
}

const defaultSettings: RAGSettings = {
  threshold: 0.6,
  maxResults: 5,
  maxExcerpts: 3,
  temperature: 0.7,
  minThreshold: 0.35,
};

export default function RAGSettingsPage() {
  const [settings, setSettings] = useState<RAGSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Load settings from API
    const loadSettings = async () => {
      try {
        const response = await fetch('/admin/rag-settings/api');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to load RAG settings:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('rag-settings');
        if (saved) {
          try {
            setSettings(JSON.parse(saved));
          } catch (e) {
            console.error('Failed to parse saved RAG settings');
          }
        }
      }
    };
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/admin/rag-settings/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        const result = await response.json();
        setSettings(result.settings);
        setLastSaved(new Date());
        toast.success('RAG settings saved successfully!');
        
        // Also save to localStorage as backup
        localStorage.setItem('rag-settings', JSON.stringify(settings));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save RAG settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset to defaults');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Search Settings</h1>
        <p className="text-muted-foreground mt-2">
          Control how the AI finds and uses information from your knowledge base to answer questions
        </p>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How this works:</h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            When someone asks a question, the AI searches through your uploaded documents to find relevant information. 
            These settings control how strict the search is and how much information to include in the answer.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Search Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle>Search Accuracy</CardTitle>
            <CardDescription>
              How closely documents must match the question to be included
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="threshold">Primary Match Strength</Label>
                <Badge variant="secondary">{(settings.threshold * 100).toFixed(0)}%</Badge>
              </div>
              <Slider
                id="threshold"
                min={0.1}
                max={0.9}
                step={0.05}
                value={[settings.threshold]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, threshold: value }))}
                className="w-full"
              />
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
                <p><strong>What this means:</strong></p>
                <p>• <strong>Higher values (70-90%):</strong> Only very relevant documents will be found</p>
                <p>• <strong>Lower values (10-50%):</strong> More documents will be found, but some may be less relevant</p>
                <p>• <strong>Recommended:</strong> Start with 60% and adjust based on results</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="minThreshold">Backup Match Strength</Label>
                <Badge variant="secondary">{(settings.minThreshold * 100).toFixed(0)}%</Badge>
              </div>
              <Slider
                id="minThreshold"
                min={0.1}
                max={0.6}
                step={0.05}
                value={[settings.minThreshold]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, minThreshold: value }))}
                className="w-full"
              />
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded text-sm">
                <p><strong>Backup search:</strong></p>
                <p>If no documents match the primary strength, the AI will try again with this lower setting to ensure it finds something helpful.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Amount */}
        <Card>
          <CardHeader>
            <CardTitle>Information Amount</CardTitle>
            <CardDescription>
              How much information to include in AI responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxResults">Documents to Use</Label>
                <Badge variant="secondary">{settings.maxResults}</Badge>
              </div>
              <Slider
                id="maxResults"
                min={1}
                max={10}
                step={1}
                value={[settings.maxResults]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, maxResults: value }))}
                className="w-full"
              />
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded text-sm">
                <p><strong>How many documents to reference:</strong></p>
                <p>• <strong>Fewer (1-3):</strong> Focused, concise answers</p>
                <p>• <strong>More (4-10):</strong> Comprehensive answers with multiple sources</p>
                <p>• <strong>Recommended:</strong> 3-5 documents for balanced responses</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxExcerpts">Key Points per Document</Label>
                <Badge variant="secondary">{settings.maxExcerpts}</Badge>
              </div>
              <Slider
                id="maxExcerpts"
                min={1}
                max={8}
                step={1}
                value={[settings.maxExcerpts]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, maxExcerpts: value }))}
                className="w-full"
              />
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded text-sm">
                <p><strong>Key information extraction:</strong></p>
                <p>The AI will find the most relevant sentences from each document. More key points = more detailed answers, but longer responses.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Style */}
        <Card>
          <CardHeader>
            <CardTitle>Response Style</CardTitle>
            <CardDescription>
              Control how creative or focused the AI responses are
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Creativity Level</Label>
                <Badge variant="secondary">{settings.temperature.toFixed(1)}</Badge>
              </div>
              <Slider
                id="temperature"
                min={0.0}
                max={2.0}
                step={0.1}
                value={[settings.temperature]}
                onValueChange={([value]) => setSettings(prev => ({ ...prev, temperature: value }))}
                className="w-full"
              />
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded text-sm">
                <p><strong>Response creativity:</strong></p>
                <p>• <strong>Low (0.0-0.5):</strong> Precise, factual, consistent answers</p>
                <p>• <strong>Medium (0.6-1.0):</strong> Balanced responses with some variation</p>
                <p>• <strong>High (1.1-2.0):</strong> Creative, varied, but potentially less accurate</p>
                <p>• <strong>Recommended:</strong> 0.7 for most business uses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Save Your Changes</CardTitle>
            <CardDescription>
              Changes take effect immediately after saving
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                <strong>Testing your settings:</strong> After saving, try asking questions in the chat to see how the changes affect the AI&apos;s responses.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Start with the recommended settings, then adjust based on the quality of answers you&apos;re getting.
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset to Recommended
                </Button>
              </div>
              {lastSaved && (
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Settings saved!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lastSaved.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
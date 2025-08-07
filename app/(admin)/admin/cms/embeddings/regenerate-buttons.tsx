'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap } from 'lucide-react';
import { regenerateAllEmbeddings, regenerateEmbedding } from './actions';

export function RegenerateAllButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await regenerateAllEmbeddings();
      console.log('Regeneration result:', result);
      router.refresh(); // Force page refresh
    } catch (error) {
      console.error('Error regenerating embeddings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full">
      <RefreshCw className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Regenerating...' : 'Regenerate All Embeddings'}
    </Button>
  );
}

export function RegenerateButton({ contentId }: { contentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await regenerateEmbedding(contentId);
      console.log('Individual regeneration result:', result);
      router.refresh(); // Force page refresh
    } catch (error) {
      console.error('Error regenerating embedding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading} 
      variant="outline" 
      size="sm"
    >
      <Zap className={`size-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Regenerating...' : 'Regenerate'}
    </Button>
  );
}
'use server';

import { auth } from '@/app/(auth)/auth';
import { batchUpdateEmbeddings, updateContentEmbedding } from '@/lib/ai/cms';
import { revalidatePath } from 'next/cache';

export async function regenerateAllEmbeddings() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    console.log('Starting batch embedding regeneration');
    const results = await batchUpdateEmbeddings(session.user.id);
    console.log('Batch regeneration results:', results);
    
    revalidatePath('/admin/cms/embeddings');
    revalidatePath('/admin/cms');
    return { success: true, results };
  } catch (error) {
    console.error('Error regenerating embeddings:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function regenerateEmbedding(contentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    console.log(`Starting embedding regeneration for content ID: ${contentId}`);
    const success = await updateContentEmbedding(contentId, session.user.id);
    
    if (success) {
      console.log(`Successfully regenerated embedding for content ID: ${contentId}`);
      revalidatePath('/admin/cms/embeddings');
      revalidatePath('/admin/cms');
      return { success: true };
    } else {
      console.log(`Failed to regenerate embedding for content ID: ${contentId}`);
      return { success: false, error: 'Content not found or update failed' };
    }
  } catch (error) {
    console.error('Error regenerating embedding:', error);
    return { success: false, error: (error as Error).message };
  }
}
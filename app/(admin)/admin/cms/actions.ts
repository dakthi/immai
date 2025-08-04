'use server';

import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { cmsContent } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateEmbedding, prepareTextForEmbedding } from '@/lib/ai/embeddings';

export async function getCMSContent() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const content = await db
    .select()
    .from(cmsContent)
    .where(eq(cmsContent.userId, session.user.id))
    .orderBy(desc(cmsContent.updatedAt));

  return content;
}

export async function getCMSContentBySlug(slug: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const content = await db
    .select()
    .from(cmsContent)
    .where(eq(cmsContent.slug, slug))
    .limit(1);

  return content[0] || null;
}

export async function createCMSContent(data: {
  title: string;
  slug: string;
  content: string;
  type: 'prompt' | 'template' | 'document' | 'config';
  category?: string;
  tags?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Prepare text for embedding
    const textToEmbed = prepareTextForEmbedding(
      data.title,
      data.content,
      data.type
    );

    // Generate embedding
    const embedding = await generateEmbedding(textToEmbed);

    await db.insert(cmsContent).values({
      ...data,
      userId: session.user.id,
      tags: data.tags || [],
      embedding: JSON.stringify(embedding),
    });

    revalidatePath('/admin/cms');
  } catch (error) {
    console.error('Error creating CMS content with embedding:', error);
    // Fall back to creating without embedding
    await db.insert(cmsContent).values({
      ...data,
      userId: session.user.id,
      tags: data.tags || [],
    });

    revalidatePath('/admin/cms');
  }
}

export async function updateCMSContent(
  id: string,
  data: {
    title: string;
    slug: string;
    content: string;
    type: 'prompt' | 'template' | 'document' | 'config';
    category?: string;
    tags?: string[];
    isActive: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Prepare text for embedding
    const textToEmbed = prepareTextForEmbedding(
      data.title,
      data.content,
      data.type
    );

    // Generate embedding
    const embedding = await generateEmbedding(textToEmbed);

    await db
      .update(cmsContent)
      .set({
        ...data,
        tags: data.tags || [],
        embedding: JSON.stringify(embedding),
        updatedAt: new Date(),
      })
      .where(eq(cmsContent.id, id));

    revalidatePath('/admin/cms');
  } catch (error) {
    console.error('Error updating CMS content with embedding:', error);
    // Fall back to updating without embedding
    await db
      .update(cmsContent)
      .set({
        ...data,
        tags: data.tags || [],
        updatedAt: new Date(),
      })
      .where(eq(cmsContent.id, id));

    revalidatePath('/admin/cms');
  }
}

export async function deleteCMSContent(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await db.delete(cmsContent).where(eq(cmsContent.id, id));
  revalidatePath('/admin/cms');
}

export async function getCMSContentById(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const content = await db
    .select()
    .from(cmsContent)
    .where(eq(cmsContent.id, id))
    .limit(1);

  return content[0] || null;
}
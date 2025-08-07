import { db } from '@/lib/db';
import { cmsContent } from '@/lib/db/schema';
import { eq, and, sql, } from 'drizzle-orm';
import { generateEmbedding, prepareTextForEmbedding, cosineSimilarity } from './embeddings';

export async function getCMSPrompts(userId: string) {
  return await db
    .select()
    .from(cmsContent)
    .where(
      and(
        eq(cmsContent.userId, userId),
        eq(cmsContent.type, 'prompt'),
        eq(cmsContent.isActive, true)
      )
    );
}

export async function getCMSTemplates(userId: string) {
  return await db
    .select()
    .from(cmsContent)
    .where(
      and(
        eq(cmsContent.userId, userId),
        eq(cmsContent.type, 'template'),
        eq(cmsContent.isActive, true)
      )
    );
}

export async function getCMSContentBySlugAndUser(slug: string, userId: string) {
  const content = await db
    .select()
    .from(cmsContent)
    .where(
      and(
        eq(cmsContent.slug, slug),
        eq(cmsContent.userId, userId),
        eq(cmsContent.isActive, true)
      )
    )
    .limit(1);

  return content[0] || null;
}

export async function getAllUserCMSContent(userId: string) {
  return await db
    .select()
    .from(cmsContent)
    .where(
      and(
        eq(cmsContent.userId, userId),
        eq(cmsContent.isActive, true)
      )
    );
}

export async function findSimilarContent(
  query: string,
  userId: string,
  limit = 5,
  threshold = 0.7
) {
  console.log('🔍 [CMS] Starting similarity search');
  console.log('👤 [CMS] User ID:', userId);
  console.log('💬 [CMS] Query:', query);
  console.log('📊 [CMS] Limit:', limit, 'Threshold:', threshold);
  
  try {
    // Generate embedding for the query
    console.log('🧠 [CMS] Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    console.log('✅ [CMS] Query embedding generated');
    
    // Get all content with embeddings
    console.log('📚 [CMS] Fetching user content with embeddings from database...');
    const allContent = await db
      .select()
      .from(cmsContent)
      .where(
        and(
          eq(cmsContent.userId, userId),
          eq(cmsContent.isActive, true),
          sql`${cmsContent.embedding} IS NOT NULL`
        )
      );
    
    console.log('📊 [CMS] Found', allContent.length, 'documents with embeddings');
    
    // Log all documents in knowledge base
    console.log('📚 [CMS] ===== KNOWLEDGE BASE DOCUMENTS =====');
    allContent.forEach((doc, index) => {
      console.log(`📄 [CMS] ${index + 1}. "${doc.title}" (${doc.type}) - ${doc.content.substring(0, 100)}...`);
    });
    console.log('📚 [CMS] ===== END KNOWLEDGE BASE =====');

    // Calculate cosine similarity for each item
    console.log('🧮 [CMS] Calculating similarities for all documents...');
    const results = allContent
      .map((item, index) => {
        try {
          console.log(`📐 [CMS] Processing document ${index + 1}/${allContent.length}: "${item.title}"`);
          if (!item.embedding) {
            console.error('❌ [CMS] Missing embedding for item:', item.id);
            return null;
          }
          const itemEmbedding = JSON.parse(item.embedding);
          const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
          
          const result = {
            id: item.id,
            title: item.title,
            content: item.content,
            type: item.type,
            category: item.category,
            tags: item.tags,
            similarity,
          };
          
          console.log(`✅ [CMS] Document "${item.title}" similarity: ${(similarity * 100).toFixed(1)}%`);
          return result;
        } catch (error) {
          console.error('❌ [CMS] Error parsing embedding for item:', item.id, error);
          return null;
        }
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .filter(result => {
        const passes = result.similarity >= threshold;
        if (!passes) {
          console.log(`🚫 [CMS] Document "${result.title}" filtered out (similarity: ${(result.similarity * 100).toFixed(1)}% < threshold: ${(threshold * 100).toFixed(1)}%)`);
        }
        return passes;
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log('🎯 [CMS] Final results after filtering and sorting:');
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.title}" (${result.type}) - ${(result.similarity * 100).toFixed(1)}%`);
    });

    console.log('✅ [CMS] Similarity search completed, returning', results.length, 'results');
    return results;
  } catch (error) {
    console.error('❌ [CMS] Error finding similar content:', error);
    return [];
  }
}

export async function updateContentEmbedding(contentId: string, userId: string) {
  console.log('🔄 [CMS-UPDATE] Starting embedding update');
  console.log('📄 [CMS-UPDATE] Content ID:', contentId);
  console.log('👤 [CMS-UPDATE] User ID:', userId);
  
  try {
    // Get content by ID
    console.log('📚 [CMS-UPDATE] Fetching content from database...');
    const [contentData] = await db
      .select()
      .from(cmsContent)
      .where(and(eq(cmsContent.id, contentId), eq(cmsContent.userId, userId)))
      .limit(1);

    if (!contentData) {
      console.log(`❌ [CMS-UPDATE] Content not found for ID: ${contentId}`);
      return false;
    }

    console.log('✅ [CMS-UPDATE] Content found:', contentData.title);
    console.log('📊 [CMS-UPDATE] Content type:', contentData.type);
    console.log('📝 [CMS-UPDATE] Content length:', contentData.content.length, 'characters');

    // Prepare text for embedding
    const textToEmbed = prepareTextForEmbedding(
      contentData.title,
      contentData.content,
      contentData.type
    );

    // Generate embedding
    console.log(`🧠 [CMS-UPDATE] Generating embedding for content: ${contentData.title}`);
    const embedding = await generateEmbedding(textToEmbed);

    // Update the content with embedding
    console.log('💾 [CMS-UPDATE] Saving embedding to database...');
    const result = await db
      .update(cmsContent)
      .set({
        embedding: JSON.stringify(embedding),
        updatedAt: new Date(),
      })
      .where(eq(cmsContent.id, contentId));

    console.log(`✅ [CMS-UPDATE] Embedding updated successfully for content: ${contentData.title}`);
    return true;
  } catch (error) {
    console.error('❌ [CMS-UPDATE] Error updating content embedding:', error);
    return false;
  }
}

export async function batchUpdateEmbeddings(userId: string) {
  console.log('🔄 [CMS-BATCH] Starting batch embedding update');
  console.log('👤 [CMS-BATCH] User ID:', userId);
  
  try {
    // Get all content without embeddings
    console.log('📚 [CMS-BATCH] Fetching content without embeddings...');
    const contentWithoutEmbeddings = await db
      .select()
      .from(cmsContent)
      .where(
        and(
          eq(cmsContent.userId, userId),
          eq(cmsContent.isActive, true),
          sql`${cmsContent.embedding} IS NULL`
        )
      );

    console.log('📊 [CMS-BATCH] Found', contentWithoutEmbeddings.length, 'documents without embeddings');

    const results = [];
    
    for (const [index, content] of contentWithoutEmbeddings.entries()) {
      console.log(`🔄 [CMS-BATCH] Processing ${index + 1}/${contentWithoutEmbeddings.length}: "${content.title}"`);
      const success = await updateContentEmbedding(content.id, userId);
      results.push({ id: content.id, title: content.title, success });
      
      if (success) {
        console.log(`✅ [CMS-BATCH] Successfully embedded: "${content.title}"`);
      } else {
        console.log(`❌ [CMS-BATCH] Failed to embed: "${content.title}"`);
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ [CMS-BATCH] Batch update completed: ${successCount}/${results.length} successful`);

    return results;
  } catch (error) {
    console.error('❌ [CMS-BATCH] Error batch updating embeddings:', error);
    return [];
  }
}
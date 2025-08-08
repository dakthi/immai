import { db } from '@/lib/db';
import { cmsContent } from '@/lib/db/schema';
import { eq, and, sql, } from 'drizzle-orm';
import { generateEmbedding, prepareTextForEmbedding, } from './embeddings';
import { BM25Search } from './bm25';

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
  console.log('🔍 [CMS] Starting BM25 search');
  console.log('👤 [CMS] User ID:', userId);
  console.log('💬 [CMS] Query:', query);
  console.log('📊 [CMS] Limit:', limit, 'Threshold:', threshold);
  
  try {
    // Get all active content for the user
    console.log('📚 [CMS] Fetching user content from database...');
    const allContent = await db
      .select()
      .from(cmsContent)
      .where(
        and(
          eq(cmsContent.userId, userId),
          eq(cmsContent.isActive, true)
        )
      );
    
    console.log('📊 [CMS] Found', allContent.length, 'documents');
    
    // Log all documents in knowledge base
    console.log('📚 [CMS] ===== KNOWLEDGE BASE DOCUMENTS =====');
    allContent.forEach((doc, index) => {
      console.log(`📄 [CMS] ${index + 1}. "${doc.title}" (${doc.type}) - ${doc.content.substring(0, 100)}...`);
    });
    console.log('📚 [CMS] ===== END KNOWLEDGE BASE =====');

    if (allContent.length === 0) {
      console.log('❌ [CMS] No content found for user');
      return [];
    }

    // Create BM25 search instance and add documents
    console.log('🔧 [CMS] Creating BM25 search index...');
    const bm25Search = new BM25Search();
    bm25Search.addDocuments(allContent.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      type: doc.type,
      category: doc.category,
      tags: doc.tags
    })));

    // Perform BM25 search
    console.log('🔍 [CMS] Performing BM25 search...');
    const bm25Results = bm25Search.search(query, limit * 2); // Get more results to filter

    // Convert BM25 scores to similarity-like scores (0-1 range)
    // BM25 scores are unbounded, so we normalize them
    const maxScore = bm25Results.length > 0 ? bm25Results[0].score : 1;
    const results = bm25Results
      .map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        type: result.type,
        category: result.category,
        tags: result.tags,
        similarity: maxScore > 0 ? result.score / maxScore : 0, // Normalize to 0-1
      }))
      .filter(result => {
        const passes = result.similarity >= threshold;
        if (!passes) {
          console.log(`🚫 [CMS] Document "${result.title}" filtered out (similarity: ${(result.similarity * 100).toFixed(1)}% < threshold: ${(threshold * 100).toFixed(1)}%)`);
        }
        return passes;
      })
      .slice(0, limit);

    console.log('🎯 [CMS] Final results after filtering and sorting:');
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.title}" (${result.type}) - ${(result.similarity * 100).toFixed(1)}%`);
    });

    console.log('✅ [CMS] BM25 search completed, returning', results.length, 'results');
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
import 'server-only';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

// Initialize OpenAI provider
const provider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use text-embedding-3-small for cost efficiency (1536 dimensions)
const embeddingModel = provider.embedding('text-embedding-3-small');

export async function generateEmbedding(text: string): Promise<number[]> {
  console.log('🧠 [EMBED] Starting embedding generation');
  console.log('📝 [EMBED] Text length:', text.length, 'characters');
  console.log('📄 [EMBED] Text preview:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
  
  try {
    const startTime = Date.now();
    console.log('🔄 [EMBED] Calling OpenAI embedding API...');
    
    const { embedding } = await embed({
      model: embeddingModel,
      value: text,
    });
    
    const duration = Date.now() - startTime;
    console.log('✅ [EMBED] Embedding generated successfully');
    console.log('📊 [EMBED] Embedding dimensions:', embedding.length);
    console.log('⏱️ [EMBED] Generation time:', duration + 'ms');
    
    return embedding;
  } catch (error) {
    console.error('❌ [EMBED] Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  console.log('🧠 [EMBED-BATCH] Starting batch embedding generation');
  console.log('📊 [EMBED-BATCH] Number of texts:', texts.length);
  
  try {
    const startTime = Date.now();
    console.log('🔄 [EMBED-BATCH] Calling OpenAI batch embedding API...');
    
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: texts,
    });
    
    const duration = Date.now() - startTime;
    console.log('✅ [EMBED-BATCH] Batch embeddings generated successfully');
    console.log('📊 [EMBED-BATCH] Generated', embeddings.length, 'embeddings');
    console.log('⏱️ [EMBED-BATCH] Total generation time:', duration + 'ms');
    console.log('⚡ [EMBED-BATCH] Average time per embedding:', Math.round(duration / embeddings.length) + 'ms');
    
    return embeddings;
  } catch (error) {
    console.error('❌ [EMBED-BATCH] Error generating batch embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

export function prepareTextForEmbedding(title: string, content: string, type?: string): string {
  console.log('🔧 [EMBED-PREP] Preparing text for embedding');
  console.log('📝 [EMBED-PREP] Title:', title);
  console.log('📄 [EMBED-PREP] Content length:', content.length, 'characters');
  console.log('🏷️ [EMBED-PREP] Type:', type || 'none');

  // Combine title and content with type context for better semantic understanding
  const typePrefix = type ? `[${type.toUpperCase()}] ` : '';
  const preparedText = `${typePrefix}${title}\n\n${content}`.trim();
  
  console.log('✅ [EMBED-PREP] Prepared text length:', preparedText.length, 'characters');
  console.log('📋 [EMBED-PREP] Prepared text preview:', preparedText.substring(0, 150) + (preparedText.length > 150 ? '...' : ''));
  
  return preparedText;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  console.log('📐 [COSINE] Calculating cosine similarity');
  console.log('📊 [COSINE] Vector A dimensions:', a.length);
  console.log('📊 [COSINE] Vector B dimensions:', b.length);
  
  if (a.length !== b.length) {
    console.error('❌ [COSINE] Vector dimension mismatch:', a.length, 'vs', b.length);
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  
  console.log('🎯 [COSINE] Calculated similarity:', similarity.toFixed(4));
  
  return similarity;
}
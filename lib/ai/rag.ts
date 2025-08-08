import 'server-only';
import { findSimilarContent } from './cms';
import { getRAGSettings } from '@/lib/rag-settings';

export interface RAGContext {
  hasRelevantContent: boolean;
  context: string;
  contextSummary: string;
  sources: Array<{
    id: string;
    title: string;
    type: string;
    category?: string;
    tags: string[];
    similarity: number;
    relevantExcerpts?: string[];
  }>;
  totalSources: number;
  averageSimilarity: number;
}

function normalizeQuery(query: string): string {
  // Normalize Vietnamese queries to full sentences
  const vietnameseExpansions: Record<string, string> = {
    'năm': 'Bạn đã sống và làm việc ở Canada bao nhiêu năm',
    'bao nhiêu năm': 'Bạn đã sống và làm việc ở Canada bao nhiêu năm',
    'canada': 'thông tin về Canada định cư',
    'định cư': 'thông tin về định cư Canada',
    'express entry': 'chương trình Express Entry Canada',
    'pnp': 'chương trình Provincial Nominee Program',
    'việc làm': 'tìm việc làm ở Canada',
    'cv': 'viết CV theo chuẩn Canada',
  };

  const lowerQuery = query.toLowerCase().trim();
  
  // Check for Vietnamese expansions
  for (const [key, expansion] of Object.entries(vietnameseExpansions)) {
    if (lowerQuery.includes(key)) {
      console.log('🔄 [RAG] Normalizing query from:', query, 'to:', expansion);
      return expansion;
    }
  }
  
  return query;
}

function expandQuery(query: string): string[] {
  console.log('🔍 [RAG] Expanding query:', query);
  
  // First normalize the query
  const normalizedQuery = normalizeQuery(query);
  const queries = [query, normalizedQuery]; // Include both original and normalized
  
  // Extract keywords and add variations
  const baseQuery = normalizedQuery.toLowerCase();
  const words = baseQuery.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length > 1) {
    // Add individual keywords for broader search
    queries.push(...words);
    
    // Add partial combinations
    if (words.length > 2) {
      for (let i = 0; i < words.length - 1; i++) {
        queries.push(`${words[i]} ${words[i + 1]}`);
      }
    }
  }
  
  // Add English translations for common Vietnamese terms
  const translations: Record<string, string> = {
    'định cư': 'immigration',
    'canada': 'canada',
    'việc làm': 'job employment work',
    'năm': 'years year',
    'kinh nghiệm': 'experience',
  };
  
  for (const [vietnamese, english] of Object.entries(translations)) {
    if (baseQuery.includes(vietnamese)) {
      queries.push(english);
    }
  }
  
  const expandedQueries = [...new Set(queries)]; // Remove duplicates
  console.log('📝 [RAG] Expanded queries:', expandedQueries);
  return expandedQueries;
}

function extractRelevantExcerpts(content: string, query: string, maxExcerpts?: number): string[] {
  const settings = getRAGSettings();
  const actualMaxExcerpts = maxExcerpts ?? settings.maxExcerpts;
  console.log('✂️ [RAG] Extracting excerpts from content (length:', content.length, ') for query:', query);
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (lowerSentence.includes(word)) {
        score += 1;
      }
    });
    
    return { sentence: sentence.trim(), score };
  });
  
  const excerpts = scoredSentences
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(actualMaxExcerpts, 8)) // Use dynamic setting
    .map(s => s.sentence);
    
  console.log('🎯 [RAG] Extracted', excerpts.length, 'relevant excerpts');
  return excerpts;
}

function summarizeContent(excerpts: string[], title: string): string {
  // Simple rule-based summarization
  if (excerpts.length === 0) return '';
  
  // Take the most relevant excerpt and create a concise summary
  const mainExcerpt = excerpts[0];
  
  // If it's too long, truncate to first 150 characters
  if (mainExcerpt.length > 150) {
    return `${mainExcerpt.substring(0, 147)}...`;
  }
  
  return mainExcerpt;
}

function generateContextSummary(sources: any[]): string {
  console.log('📊 [RAG] Generating context summary for', sources.length, 'sources');
  
  const types = [...new Set(sources.map(s => s.type))];
  const categories = [...new Set(sources.map(s => s.category).filter(Boolean))];
  
  console.log('📁 [RAG] Document types:', types);
  console.log('🏷️ [RAG] Categories:', categories);
  
  let summary = `Found ${sources.length} relevant document${sources.length > 1 ? 's' : ''}`;
  
  if (types.length > 0) {
    summary += ` (${types.join(', ')})`;
  }
  
  if (categories.length > 0) {
    summary += ` from categories: ${categories.join(', ')}`;
  }
  
  console.log('✅ [RAG] Context summary:', summary);
  return summary;
}

export async function getRAGContext(
  userMessage: string,
  userId: string,
  threshold = 0.65,
  maxResults = 5
): Promise<RAGContext> {
  console.log('🚀 [RAG] Starting RAG context retrieval');
  console.log('👤 [RAG] User ID:', userId);
  console.log('💬 [RAG] User message:', userMessage);
  console.log('⚙️ [RAG] Threshold:', threshold, 'Max results:', maxResults);
  
  try {
    // Search for relevant content in user's knowledge base
    console.log('🔎 [RAG] Searching for similar content...');
    const results = await findSimilarContent(userMessage, userId, maxResults, threshold);
    console.log('📊 [RAG] Found', results.length, 'results from CMS search');
    
    if (results.length === 0) {
      console.log('❌ [RAG] No relevant content found');
      return {
        hasRelevantContent: false,
        context: '',
        contextSummary: 'No relevant content found in knowledge base',
        sources: [],
        totalSources: 0,
        averageSimilarity: 0,
      };
    }

    // Extract relevant excerpts and format context
    console.log('🔧 [RAG] Processing results and extracting excerpts...');
    const enhancedResults = results.map((result, index) => {
      console.log(`📝 [RAG] Processing result ${index + 1}: "${result.title}" (similarity: ${(result.similarity * 100).toFixed(1)}%)`);
      return {
        ...result,
        relevantExcerpts: extractRelevantExcerpts(result.content, userMessage),
      };
    });

    // Format the context from search results with summarized content
    const contextParts = enhancedResults.map((result) => {
      const summary = summarizeContent(result.relevantExcerpts, result.title);
      
      const metadata = [
        result.category && `Category: ${result.category}`,
        result.tags && result.tags.length > 0 && `Tags: ${result.tags.join(', ')}`,
        `Similarity: ${(result.similarity * 100).toFixed(1)}%`
      ].filter(Boolean).join(' | ');

      return `📄 **${result.title}** (${result.type})
${metadata}
Summary: ${summary}`;
    });

    const context = contextParts.join(`\n\n${'─'.repeat(80)}\n\n`);
    
    const sources = enhancedResults.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      category: result.category || undefined,
      tags: result.tags || [],
      similarity: result.similarity,
      relevantExcerpts: result.relevantExcerpts,
    }));

    const averageSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const contextSummary = generateContextSummary(results);

    console.log('📋 [RAG] Final context length:', context.length, 'characters');
    console.log('📊 [RAG] Average similarity:', `${(averageSimilarity * 100).toFixed(1)}%`);
    console.log('✅ [RAG] RAG context retrieval completed successfully');

    return {
      hasRelevantContent: true,
      context,
      contextSummary,
      sources,
      totalSources: results.length,
      averageSimilarity,
    };
  } catch (error) {
    console.error('❌ [RAG] Error getting RAG context:', error);
    return {
      hasRelevantContent: false,
      context: '',
      contextSummary: 'Error retrieving context from knowledge base',
      sources: [],
      totalSources: 0,
      averageSimilarity: 0,
    };
  }
}

export function buildRAGPrompt(
  originalPrompt: string,
  ragContext: RAGContext,
  userMessage: string
): string {
  if (!ragContext.hasRelevantContent) {
    return originalPrompt;
  }

  const sourcesInfo = ragContext.sources.map(s => 
    `• "${s.title}" (${s.type}${s.category ? `, ${s.category}` : ''}) - ${(s.similarity * 100).toFixed(1)}% match`
  ).join('\n');

  const ragInstructions = `
📚 KNOWLEDGE BASE CONTEXT (${ragContext.contextSummary}):

${ragContext.context}

---

📊 CONTEXT METADATA:
${sourcesInfo}
Average relevance: ${(ragContext.averageSimilarity * 100).toFixed(1)}%

---

🎯 IMPORTANT INSTRUCTIONS FOR USING THIS CONTEXT:
1. **PRIMARY SOURCE**: Use the above context as your PRIMARY source of information
2. **ATTRIBUTION**: Always cite specific documents when referencing them (e.g., "According to your document '${ragContext.sources[0]?.title}'...")
3. **RELEVANCE**: Focus on the most relevant excerpts and information
4. **SUPPLEMENTATION**: If context doesn't fully answer the question, supplement with general knowledge but clearly distinguish between sources
5. **TRANSPARENCY**: Be explicit about what comes from their knowledge base vs. general knowledge
6. **ACCURACY**: If there are contradictions between documents, acknowledge them and ask for clarification

`;

  return `${originalPrompt}

${ragInstructions}`;
}

async function searchWithDynamicThreshold(
  expandedQueries: string[],
  userId: string,
  maxResults: number,
  initialThreshold = 0.6
): Promise<any[]> {
  const settings = getRAGSettings();
  const thresholds = [initialThreshold, 0.45, settings.minThreshold]; // Use dynamic min threshold
  const allResults = new Map();
  
  for (const threshold of thresholds) {
    console.log(`🎯 [RAG-DYNAMIC] Trying threshold: ${threshold}`);
    allResults.clear();
    
    // Search with each expanded query at current threshold
    for (const query of expandedQueries) {
      console.log(`🔎 [RAG-DYNAMIC] Searching with query: "${query}" (threshold: ${threshold})`);
      const results = await findSimilarContent(query, userId, maxResults, threshold);
      console.log(`📊 [RAG-DYNAMIC] Found ${results.length} results for query: "${query}"`);
      
      results.forEach(result => {
        const existingResult = allResults.get(result.id);
        if (!existingResult || result.similarity > existingResult.similarity) {
          allResults.set(result.id, result);
        }
      });
    }
    
    const combinedResults = Array.from(allResults.values());
    console.log(`📋 [RAG-DYNAMIC] Threshold ${threshold}: found ${combinedResults.length} unique documents`);
    
    // If we found enough results, stop here
    if (combinedResults.length >= 2) {
      console.log(`✅ [RAG-DYNAMIC] Success with threshold ${threshold}`);
      return combinedResults.sort((a, b) => b.similarity - a.similarity).slice(0, maxResults);
    }
  }
  
  console.log('⚠️ [RAG-DYNAMIC] No results found even with lowest threshold');
  return Array.from(allResults.values()).sort((a, b) => b.similarity - a.similarity).slice(0, maxResults);
}

export async function getAdvancedRAGContext(
  userMessage: string,
  userId: string,
  threshold?: number,
  maxResults?: number
): Promise<RAGContext> {
  const settings = getRAGSettings();
  const actualThreshold = threshold ?? settings.threshold;
  const actualMaxResults = maxResults ?? settings.maxResults;
  console.log('🚀 [RAG-ADV] Starting Advanced RAG context retrieval');
  console.log('👤 [RAG-ADV] User ID:', userId);
  console.log('💬 [RAG-ADV] User message:', userMessage);
  console.log('⚙️ [RAG-ADV] Using threshold:', actualThreshold, 'Max results:', actualMaxResults);
  console.log('🔧 [RAG-ADV] Settings from admin:', settings);

  try {
    // Expand the query to catch more relevant content
    const expandedQueries = expandQuery(userMessage);
    
    console.log('🔍 [RAG-ADV] Starting dynamic threshold search with', expandedQueries.length, 'queries');
    
    // Use dynamic threshold search
    const combinedResults = await searchWithDynamicThreshold(expandedQueries, userId, actualMaxResults, actualThreshold);
    
    console.log(`📋 [RAG-ADV] Final results: ${combinedResults.length} unique documents`);
    combinedResults.forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.title}" - ${(result.similarity * 100).toFixed(1)}% similarity`);
    });
    
    if (combinedResults.length === 0) {
      console.log('❌ [RAG-ADV] No relevant content found after multi-query search');
      return {
        hasRelevantContent: false,
        context: '',
        contextSummary: 'No relevant content found in knowledge base',
        sources: [],
        totalSources: 0,
        averageSimilarity: 0,
      };
    }

    // Process results with enhanced context extraction
    const enhancedResults = combinedResults.map(result => ({
      ...result,
      relevantExcerpts: extractRelevantExcerpts(result.content, userMessage),
    }));

    // Format context with summarized content
    const contextParts = enhancedResults.map((result) => {
      const summary = summarizeContent(result.relevantExcerpts, result.title);
      
      const metadata = [
        result.category && `Category: ${result.category}`,
        result.tags && result.tags.length > 0 && `Tags: ${result.tags.join(', ')}`,
        `Similarity: ${(result.similarity * 100).toFixed(1)}%`
      ].filter(Boolean).join(' | ');

      return `📄 **${result.title}** (${result.type})
${metadata}
Summary: ${summary}`;
    });

    const context = contextParts.join(`\n\n${'─'.repeat(80)}\n\n`);
    
    const sources = enhancedResults.map(result => ({
      id: result.id,
      title: result.title,
      type: result.type,
      category: result.category || undefined,
      tags: result.tags || [],
      similarity: result.similarity,
      relevantExcerpts: result.relevantExcerpts,
    }));

    const averageSimilarity = combinedResults.reduce((sum, r) => sum + r.similarity, 0) / combinedResults.length;
    const contextSummary = generateContextSummary(combinedResults);

    return {
      hasRelevantContent: true,
      context,
      contextSummary,
      sources,
      totalSources: combinedResults.length,
      averageSimilarity,
    };
  } catch (error) {
    console.error('Error getting advanced RAG context:', error);
    return {
      hasRelevantContent: false,
      context: '',
      contextSummary: 'Error retrieving context from knowledge base',
      sources: [],
      totalSources: 0,
      averageSimilarity: 0,
    };
  }
}

export async function processMessageWithRAG(
  originalPrompt: string,
  userMessage: string,
  userId: string,
  useAdvanced = true
): Promise<{ prompt: string; context: RAGContext }> {
  console.log('🚀 [RAG-PROCESS] Starting RAG processing');
  console.log('👤 [RAG-PROCESS] User ID:', userId);
  console.log('💬 [RAG-PROCESS] Message:', userMessage);
  
  // Get relevant context from user's knowledge base
  const ragContext = useAdvanced 
    ? await getAdvancedRAGContext(userMessage, userId)
    : await getRAGContext(userMessage, userId);
  
  console.log('📊 [RAG-PROCESS] Context found:', ragContext.hasRelevantContent ? 'YES' : 'NO');
  
  if (ragContext.hasRelevantContent) {
    console.log('📄 [RAG-PROCESS] Context Summary:', ragContext.contextSummary);
    console.log('📝 [RAG-PROCESS] Context Length:', ragContext.context.length, 'characters');
    
    ragContext.sources.forEach((source, index) => {
      console.log(`📄 [RAG-PROCESS] Source ${index + 1}: "${source.title}" (${(source.similarity * 100).toFixed(1)}% similarity)`);
    });
    
    // Full context logging:
    console.log('📄 [RAG-PROCESS] Raw Context:', ragContext.context);
  }
  
  // Build enhanced prompt with context
  const enhancedPrompt = buildRAGPrompt(originalPrompt, ragContext, userMessage);
  
  console.log('🤖 [RAG-PROCESS] ===== PROMPT SENT TO API =====');
  console.log('📏 [RAG-PROCESS] Enhanced prompt length:', enhancedPrompt.length, 'characters');
  console.log('📄 [RAG-PROCESS] Enhanced prompt:');
  console.log(enhancedPrompt);
  console.log('🤖 [RAG-PROCESS] ===== END PROMPT =====');
  
  console.log('✅ [RAG-PROCESS] RAG processing completed');
  
  return {
    prompt: enhancedPrompt,
    context: ragContext,
  };
}
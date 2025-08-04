import { tool } from 'ai';
import { z } from 'zod';
import { getAdvancedRAGContext } from '../rag';

export const searchKnowledge = tool({
  description: 'ALWAYS search the user\'s personal knowledge base first before answering ANY question. This contains their custom documents, prompts, and information.',
  inputSchema: z.object({
    query: z.string().describe('The search query derived from the conversation context'),
  }),
  execute: async ({ query }, toolCallOptions) => {
    const user = (toolCallOptions as any)?.user;
    console.log('🔍 [SEARCH-TOOL] Knowledge search called with query:', query);
    
    if (!user?.id) {
      console.log('❌ [SEARCH-TOOL] User not authenticated');
      return {
        results: [],
        message: 'User not authenticated',
      };
    }

    try {
      console.log('🚀 [SEARCH-TOOL] Starting RAG search for user:', user.id);
      
      const ragContext = await getAdvancedRAGContext(query, user.id, 0.6, 5);
      
      console.log('📊 [SEARCH-TOOL] Found', ragContext.totalSources, 'sources');
      
      if (!ragContext.hasRelevantContent) {
        console.log('❌ [SEARCH-TOOL] No relevant content found');
        
        return {
          results: [],
          message: ragContext.contextSummary,
          context: '',
        };
      }
      
      console.log('✅ [SEARCH-TOOL] Processing results...');
      
      const processedResults = ragContext.sources.map((result, index) => {
        
        return {
          id: result.id,
          title: result.title,
          content: result.relevantExcerpts && result.relevantExcerpts.length > 0 
            ? result.relevantExcerpts.join(' ... ') 
            : `${result.title} (${result.type})`,
          type: result.type,
          category: result.category,
          tags: result.tags,
          similarity: result.similarity,
          relevantExcerpts: result.relevantExcerpts,
        };
      });
      
      console.log('✅ [SEARCH-TOOL] Search completed successfully');
      
      return {
        results: processedResults,
        message: ragContext.contextSummary,
        context: ragContext.context,
        totalSources: ragContext.totalSources,
        averageSimilarity: ragContext.averageSimilarity,
      };
    } catch (error) {
      console.error('❌ [SEARCH-TOOL] Error searching knowledge:', error);
      console.log('🔍 [SEARCH-TOOL] ===== KNOWLEDGE SEARCH ENDED (ERROR) =====');
      
      return {
        results: [],
        message: 'Error searching knowledge base',
        context: '',
      };
    }
  },
});
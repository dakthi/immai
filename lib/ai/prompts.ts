import type { ArtifactKind } from '@/components/artifact';
import type { Geo } from '@vercel/functions';
import { getCMSPrompts } from './cms';
import { db } from '@/lib/db';
import { systemPrompts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Default fallback prompts (used when CMS prompts are not available)
const DEFAULT_ARTIFACTS_PROMPT = `
// Artifacts disabled temporarily
`;

const DEFAULT_REGULAR_PROMPT = `
Bạn là Mai, trợ lý của chú Paul - chú Paul Duong là luật sư di trú với nhiều năm kinh nghiệm tại Canada, giúp hàng ngàn gia đình Việt định cư
`;

const DEFAULT_CODE_PROMPT = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

const DEFAULT_SHEET_PROMPT = `
You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

// Function to get system prompt from CMS by slug
async function getSystemPromptFromCMS(slug: string, fallback: string): Promise<string> {
  try {
    console.log(`🔍 [PROMPTS] Fetching system prompt: ${slug}`);
    
    const [prompt] = await db
      .select()
      .from(systemPrompts)
      .where(
        and(
          eq(systemPrompts.slug, slug),
          eq(systemPrompts.isActive, true)
        )
      )
      .limit(1);

    if (prompt) {
      console.log(`✅ [PROMPTS] Using custom system prompt: ${slug}`);
      return prompt.content;
    }

    console.log(`📝 [PROMPTS] No custom prompt found for ${slug}, using default`);
    return fallback;
  } catch (error) {
    console.error(`❌ [PROMPTS] Error fetching system prompt ${slug}:`, error);
    return fallback;
  }
}

// Exported prompt getters that use CMS or fallback to defaults
export const getArtifactsPrompt = async (): Promise<string> => {
  return getSystemPromptFromCMS('system-artifacts', DEFAULT_ARTIFACTS_PROMPT);
};

export const getRegularPrompt = async (): Promise<string> => {
  return getSystemPromptFromCMS('system-main', DEFAULT_REGULAR_PROMPT);
};

export const getCodePrompt = async (): Promise<string> => {
  return getSystemPromptFromCMS('system-code', DEFAULT_CODE_PROMPT);
};

export const getSheetPrompt = async (): Promise<string> => {
  return getSystemPromptFromCMS('system-sheet', DEFAULT_SHEET_PROMPT);
};

// Legacy exports for backward compatibility (deprecated - use async versions above)
export const artifactsPrompt = DEFAULT_ARTIFACTS_PROMPT;
export const regularPrompt = DEFAULT_REGULAR_PROMPT;

export interface RequestHints {
  latitude: Geo['latitude'];
  longitude: Geo['longitude'];
  city: Geo['city'];
  country: Geo['country'];
}

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
About the origin of user's request:
- lat: ${requestHints.latitude}
- lon: ${requestHints.longitude}
- city: ${requestHints.city}
- country: ${requestHints.country}
`;

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);

  // Temporarily disable artifacts for all models
  return `${regularPrompt}\n\n${requestPrompt}`;
};

export const getCustomPromptForUser = async (userId: string): Promise<string> => {
  try {
    console.log('🔍 [PROMPTS] Fetching custom prompts for user:', userId);
    
    // Get custom prompts from CMS
    const customPrompts = await getCMSPrompts(userId);
    console.log('📄 [PROMPTS] Found', customPrompts.length, 'custom prompts');
    
    if (customPrompts.length === 0) {
      console.log('📝 [PROMPTS] No custom prompts found, using system default');
      return await getRegularPrompt();
    }

    // Use the first active prompt, or combine multiple prompts if needed
    const activePrompt = customPrompts.find(p => p.isActive) || customPrompts[0];
    
    if (activePrompt) {
      console.log('✅ [PROMPTS] Using custom prompt:', activePrompt.title);
      return activePrompt.content;
    }

    console.log('📝 [PROMPTS] No active custom prompts, using system default');
    return await getRegularPrompt();
  } catch (error) {
    console.error('❌ [PROMPTS] Error fetching custom prompts:', error);
    return await getRegularPrompt();
  }
};

export const getSystemPromptWithCustomization = async ({
  selectedChatModel,
  requestHints,
  userId,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
  userId: string;
}) => {
  const requestPrompt = getRequestPromptFromHints(requestHints);
  const customPrompt = await getCustomPromptForUser(userId);

  // Temporarily disable artifacts for all models
  return `${customPrompt}\n\n${requestPrompt}`;
};

// Legacy exports for backward compatibility (deprecated - use async versions above)
export const codePrompt = DEFAULT_CODE_PROMPT;
export const sheetPrompt = DEFAULT_SHEET_PROMPT;

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: ArtifactKind,
) =>
  type === 'text'
    ? `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`
    : type === 'code'
      ? `\
Improve the following code snippet based on the given prompt.

${currentContent}
`
      : type === 'sheet'
        ? `\
Improve the following spreadsheet based on the given prompt.

${currentContent}
`
        : '';

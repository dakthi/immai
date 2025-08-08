'use server';

import { db } from '@/lib/db';
import { systemPrompts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// System prompt defaults from the original prompts.ts file
const DEFAULT_SYSTEM_PROMPTS = {
  'system-main': {
    title: 'Main System Prompt',
    content: `Bạn là Mai, trợ lý của chú Paul - chú Paul Duong là luật sư di trú với nhiều năm kinh nghiệm tại Canada, giúp hàng ngàn gia đình Việt định cư`,
    category: 'System Core'
  },
  'system-code': {
    title: 'Code Generation Prompt',
    content: `You are a Python code generator that creates self-contained, executable code snippets. When writing code:

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

print(f"Factorial of 5 is: {factorial(5)}")`,
    category: 'Code Generation'
  },
  'system-sheet': {
    title: 'Spreadsheet Creation Prompt',
    content: `You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.`,
    category: 'Data Creation'
  },
  'system-artifacts': {
    title: 'Artifacts Prompt',
    content: `// Artifacts disabled temporarily`,
    category: 'Document Generation'
  }
};

export async function getSystemPromptsFromCMS() {
  try {
    const prompts = await db
      .select()
      .from(systemPrompts);

    return prompts;
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    return [];
  }
}

export async function getSystemPromptBySlug(slug: string) {
  try {
    const [prompt] = await db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.slug, slug))
      .limit(1);

    return prompt || null;
  } catch (error) {
    console.error('Error fetching system prompt:', error);
    return null;
  }
}

export async function getSystemPromptById(id: string) {
  try {
    const [prompt] = await db
      .select()
      .from(systemPrompts)
      .where(eq(systemPrompts.id, id))
      .limit(1);

    return prompt || null;
  } catch (error) {
    console.error('Error fetching system prompt by ID:', error);
    return null;
  }
}

export async function createSystemPrompt(data: {
  title: string;
  slug: string;
  content: string;
  category?: string;
  isActive: boolean;
}) {
  try {
    await db.insert(systemPrompts).values({
      title: data.title,
      slug: data.slug,
      content: data.content,
      category: data.category || 'System Core',
      isActive: data.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath('/admin/system-prompts');
  } catch (error) {
    console.error('Error creating system prompt:', error);
    throw new Error('Failed to create system prompt');
  }
}

export async function updateSystemPrompt(id: string, data: {
  title: string;
  content: string;
  category?: string;
  isActive: boolean;
}) {
  try {
    await db
      .update(systemPrompts)
      .set({
        title: data.title,
        content: data.content,
        category: data.category || 'System Core',
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(systemPrompts.id, id));

    revalidatePath('/admin/system-prompts');
  } catch (error) {
    console.error('Error updating system prompt:', error);
    throw new Error('Failed to update system prompt');
  }
}

export async function seedDefaultSystemPrompts() {
  try {
    console.log('🌱 Seeding default system prompts...');

    for (const [slug, promptData] of Object.entries(DEFAULT_SYSTEM_PROMPTS)) {
      // Check if prompt already exists
      const existing = await getSystemPromptBySlug(slug);
      
      if (existing) {
        // Update existing prompt
        await db
          .update(systemPrompts)
          .set({
            title: promptData.title,
            content: promptData.content,
            category: promptData.category,
            updatedAt: new Date(),
            isActive: true,
          })
          .where(eq(systemPrompts.id, existing.id));
        
        console.log(`✅ Updated system prompt: ${slug}`);
      } else {
        // Create new prompt
        await db.insert(systemPrompts).values({
          title: promptData.title,
          slug: slug,
          content: promptData.content,
          category: promptData.category,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`✅ Created system prompt: ${slug}`);
      }
    }

    revalidatePath('/admin/system-prompts');
    console.log('🎉 System prompts seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding system prompts:', error);
    throw new Error('Failed to seed system prompts');
  }

  redirect('/admin/system-prompts');
}

export async function deleteSystemPrompt(id: string) {
  try {
    await db.delete(systemPrompts).where(eq(systemPrompts.id, id));
    revalidatePath('/admin/system-prompts');
  } catch (error) {
    console.error('Error deleting system prompt:', error);
    throw new Error('Failed to delete system prompt');
  }
}
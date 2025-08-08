import { SystemPromptForm } from '../components/system-prompt-form';

interface NewSystemPromptPageProps {
  searchParams: {
    type?: string;
  };
}

const promptTypeDefaults = {
  'system-main': {
    title: 'Main System Prompt',
    category: 'System Core',
    content: `Bạn là trợ lý AI thông minh và hữu ích. Bạn được thiết kế để:

1. Trả lời câu hỏi một cách chính xác và hữu ích
2. Hỗ trợ người dùng với thái độ thân thiện
3. Sử dụng tiếng Việt khi được yêu cầu
4. Đưa ra lời khuyên thực tế

Hãy luôn giữ thái độ tích cực và sẵn sàng giúp đỡ.`
  },
  'system-code': {
    title: 'Code Generation Prompt',
    category: 'Code Generation',
    content: `You are a Python code generator. Create clean, executable code that:

1. Is complete and runnable
2. Uses print() for output
3. Includes helpful comments
4. Stays concise (under 15 lines)
5. Uses standard library only
6. Handles errors gracefully

Always provide working examples with output.`
  },
  'system-sheet': {
    title: 'Spreadsheet Creation Prompt', 
    category: 'Data Creation',
    content: `You are a spreadsheet assistant. Create CSV format data with:

1. Meaningful column headers
2. Realistic sample data
3. Proper CSV formatting
4. Relevant content for the request

Focus on creating useful, well-structured data.`
  },
  'system-artifacts': {
    title: 'Artifacts Prompt',
    category: 'Document Generation', 
    content: `You are a document creation assistant. When creating documents:

1. Structure content clearly
2. Use appropriate formatting
3. Include relevant sections
4. Make content actionable

Currently in development mode.`
  }
};

export default function NewSystemPromptPage({ searchParams }: NewSystemPromptPageProps) {
  const promptType = searchParams.type;
  const defaults = promptType && promptType in promptTypeDefaults 
    ? promptTypeDefaults[promptType as keyof typeof promptTypeDefaults]
    : null;

  const initialData = defaults ? {
    title: defaults.title,
    slug: promptType || '',
    content: defaults.content,
    category: defaults.category,
    type: 'prompt' as const,
    tags: ['system', 'core'],
    isActive: true,
  } : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create System Prompt</h1>
        <p className="text-muted-foreground mt-2">
          Create a new system prompt to control AI behavior
        </p>
      </div>

      <SystemPromptForm initialData={initialData} />
    </div>
  );
}
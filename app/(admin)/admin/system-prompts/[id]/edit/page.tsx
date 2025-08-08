import { getSystemPromptById } from '../../actions';
import { SystemPromptForm } from '../../components/system-prompt-form';
import { notFound } from 'next/navigation';

interface EditSystemPromptPageProps {
  params: {
    id: string;
  };
}

export default async function EditSystemPromptPage({ params }: EditSystemPromptPageProps) {
  const content = await getSystemPromptById(params.id);

  if (!content) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit System Prompt</h1>
        <p className="text-muted-foreground mt-2">
          Modify the system prompt that controls AI behavior
        </p>
      </div>

      <SystemPromptForm initialData={content} />
    </div>
  );
}
import { getCMSContentById } from '../../actions';
import { CMSForm } from '../../components/cms-form';
import { notFound } from 'next/navigation';

interface EditCMSPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCMSPage({ params }: EditCMSPageProps) {
  const { id } = await params;
  
  const content = await getCMSContentById(id);
  
  if (!content) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Content</h1>
      <CMSForm initialData={content} />
    </div>
  );
}
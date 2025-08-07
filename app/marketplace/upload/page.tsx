import { auth } from '@/app/(auth)/auth';
import { requirePaidUser } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { UploadForm } from './components/upload-form';

export default async function UploadDocumentPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Only allow admin and paid users to upload
  if (session.user.role !== 'admin' && session.user.role !== 'paiduser') {
    redirect('/marketplace');
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Document
        </h1>
        <p className="text-gray-600">
          Share your documents with the community. Upload PDFs, Word docs, presentations, and more.
        </p>
      </div>

      <UploadForm userId={session.user.id} />
    </div>
  );
}
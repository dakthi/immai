import { getCMSContent } from '../actions';
import { findSimilarContent } from '@/lib/ai/cms';
import { auth } from '@/app/(auth)/auth';

export default async function TestPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <div>Not authenticated</div>;
  }

  const content = await getCMSContent();
  
  // Test search if there's content
  let searchResults: any[] = [];
  if (content.length > 0) {
    try {
      searchResults = await findSimilarContent('Canada immigration', session.user.id, 3, 0.5);
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">CMS Debug Page</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Content Summary</h2>
        <p>Total content items: {content.length}</p>
        <p>Items with embeddings: {content.filter(item => item.embedding).length}</p>
        <p>Items without embeddings: {content.filter(item => !item.embedding).length}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Search Test Results</h2>
        <p>Search query: &quot;Canada immigration&quot;</p>
        <p>Results found: {searchResults.length}</p>
        {searchResults.map((result, index) => (
          <div key={index} className="border p-2 mt-2">
            <h3 className="font-medium">{result.title}</h3>
            <p className="text-sm text-gray-600">Similarity: {result.similarity.toFixed(3)}</p>
            <p className="text-sm">{result.content.substring(0, 100)}...</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">All Content</h2>
        {content.map((item) => (
          <div key={item.id} className="border p-3 mb-2">
            <h3 className="font-medium">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.type} • {item.slug}</p>
            <p className="text-xs text-gray-500">
              Embedding: {item.embedding ? '✅' : '❌'}
            </p>
            <p className="text-sm mt-1">{item.content.substring(0, 150)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
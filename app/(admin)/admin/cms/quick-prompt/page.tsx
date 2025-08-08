'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createCMSContent } from '../actions';

export default function QuickPromptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createSamplePrompt = async () => {
    setLoading(true);
    
    try {
      const samplePrompt = {
        title: 'Custom AI Assistant',
        slug: 'custom-ai-assistant',
        content: `Bạn là Mai, trợ lý AI thông minh và hữu ích. Nhiệm vụ của bạn là:

1. Trả lời các câu hỏi một cách chính xác và hữu ích
2. Hỗ trợ người dùng với thái độ thân thiện và chuyên nghiệp  
3. Sử dụng tiếng Việt khi người dùng hỏi bằng tiếng Việt
4. Đưa ra lời khuyên thực tế và có thể thực hiện được
5. Thừa nhận khi không biết thông tin và đề xuất cách tìm hiểu thêm

Luôn giữ thái độ tích cực, nhiệt tình và sẵn sàng giúp đỡ người dùng.`,
        type: 'prompt' as const,
        category: 'System',
        tags: ['ai', 'assistant', 'vietnamese'],
        isActive: true,
      };

      await createCMSContent(samplePrompt);
      router.push('/admin/cms');
    } catch (error) {
      console.error('Error creating sample prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Quick Prompt Setup</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Sample Custom Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This will create a sample custom prompt that will replace the default system prompt for your AI assistant.
            You can customize this prompt through the CMS after creation.
          </p>
          
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-semibold mb-2">What this prompt will do:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Replace the default &ldquo;Mai&rdquo; assistant prompt</li>
                <li>Customize the AI&apos;s personality and behavior</li>
                <li>Support Vietnamese language responses</li>
                <li>Make the assistant more helpful and friendly</li>
              </ul>
            </div>
            
            <Button 
              onClick={createSamplePrompt} 
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Sample Prompt'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/cms')}
              className="w-full"
            >
              Back to CMS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
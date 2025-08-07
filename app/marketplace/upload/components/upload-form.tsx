'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UploadFormProps {
  userId: string;
}

export function UploadForm({ userId }: UploadFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '0.00',
    isFree: true,
    tags: [] as string[],
    tagInput: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type and size
      const maxSize = 50 * 1024 * 1024; // 50MB
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
      ];

      if (selectedFile.size > maxSize) {
        alert('File size must be less than 50MB');
        return;
      }

      if (!allowedTypes.includes(selectedFile.type)) {
        alert('File type not supported. Please upload PDF, Word, Excel, PowerPoint, images, or text files.');
        return;
      }

      setFile(selectedFile);
      // Auto-fill title from filename
      if (!formData.title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  const addTag = () => {
    const tag = formData.tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: '',
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !formData.title) {
      alert('Please select a file and provide a title');
      return;
    }

    setIsLoading(true);

    try {
      // First upload the file
      const fileFormData = new FormData();
      fileFormData.append('file', file);
      fileFormData.append('userId', userId);
      
      const uploadResponse = await fetch('/api/marketplace/upload', {
        method: 'POST',
        body: fileFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();

      // Then save document metadata
      const documentData = {
        title: formData.title,
        description: formData.description,
        category: formData.category || null,
        price: formData.isFree ? '0.00' : formData.price,
        isFree: formData.isFree,
        tags: formData.tags,
        fileName: file.name,
        filePath: uploadResult.filePath,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: userId,
      };

      const documentResponse = await fetch('/api/marketplace/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      if (!documentResponse.ok) {
        throw new Error('Failed to save document');
      }

      router.push('/marketplace?success=uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'Templates',
    'Reports',
    'Presentations',
    'Spreadsheets',
    'Documents',
    'Images',
    'Code',
    'Research',
    'Educational',
    'Business',
    'Marketing',
    'Legal',
    'Other',
  ];

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Document File *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Max file size: 50MB. Supported formats: PDF, Word, Excel, PowerPoint, Images, Text
              </p>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pricing</Label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="free"
                    checked={formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: true, price: '0.00' }))}
                  />
                  <Label htmlFor="free">Free</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="paid"
                    checked={!formData.isFree}
                    onChange={() => setFormData(prev => ({ ...prev, isFree: false }))}
                  />
                  <Label htmlFor="paid">Premium</Label>
                </div>
                {!formData.isFree && (
                  <div className="flex items-center space-x-2 ml-6">
                    <span>$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your document..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="mt-1 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={formData.tagInput}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {file && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">File Preview</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {file.name}</p>
                  <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p><strong>Type:</strong> {file.type}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/marketplace')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !file || !formData.title}>
            {isLoading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
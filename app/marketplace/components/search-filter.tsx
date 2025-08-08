'use client';

import { useState, } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface SearchFilterProps {
  categories: string[];
}

export function SearchFilter({ categories }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [fileType, setFileType] = useState(searchParams.get('fileType') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');

  const updateUrl = (
    newSearch?: string, 
    newCategory?: string, 
    newType?: string,
    newFileType?: string,
    newSort?: string
  ) => {
    const params = new URLSearchParams();
    
    const searchValue = newSearch !== undefined ? newSearch : search;
    const categoryValue = newCategory !== undefined ? newCategory : category;
    const typeValue = newType !== undefined ? newType : type;
    const fileTypeValue = newFileType !== undefined ? newFileType : fileType;
    const sortValue = newSort !== undefined ? newSort : sort;
    
    if (searchValue) params.set('search', searchValue);
    if (categoryValue) params.set('category', categoryValue);
    if (typeValue) params.set('type', typeValue);
    if (fileTypeValue) params.set('fileType', fileTypeValue);
    if (sortValue) params.set('sort', sortValue);
    
    router.push(`/marketplace?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(search);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setType('');
    setFileType('');
    setSort('');
    router.push('/marketplace');
  };

  const activeFilters = [
    search && { type: 'search', value: search, label: `Search: "${search}"` },
    category && { type: 'category', value: category, label: `Category: ${category}` },
    type && { type: 'type', value: type, label: `Type: ${type === 'free' ? 'Free' : 'Premium'}` },
    fileType && { type: 'fileType', value: fileType, label: `Format: ${fileType}` },
    sort && { type: 'sort', value: sort, label: `Sort: ${sort}` },
  ].filter((filter): filter is { type: string; value: string; label: string } => Boolean(filter));

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="size-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Search & Filter Documents</h3>
      </div>
      
      <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-64">
          <Input
            placeholder="Search documents by title, description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={category} onValueChange={(value) => {
          const newCategory = value === 'all' ? '' : value;
          setCategory(newCategory);
          updateUrl(undefined, newCategory);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={(value) => {
          const newType = value === 'all' ? '' : value;
          setType(newType);
          updateUrl(undefined, undefined, newType);
        }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Premium</SelectItem>
          </SelectContent>
        </Select>

        <Select value={fileType} onValueChange={(value) => {
          const newFileType = value === 'all' ? '' : value;
          setFileType(newFileType);
          updateUrl(undefined, undefined, undefined, newFileType);
        }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="word">Word</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
            <SelectItem value="powerpoint">PowerPoint</SelectItem>
            <SelectItem value="image">Images</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => {
          const newSort = value === 'all' ? '' : value;
          setSort(newSort);
          updateUrl(undefined, undefined, undefined, undefined, newSort);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Default</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="popular">Most Downloaded</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit">
          <Search className="size-4 mr-2" />
          Search
        </Button>
      </form>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={`${filter.type}-${filter.value}`}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                if (filter.type === 'search') {
                  setSearch('');
                  updateUrl('');
                } else if (filter.type === 'category') {
                  setCategory('');
                  updateUrl(undefined, '');
                } else if (filter.type === 'type') {
                  setType('');
                  updateUrl(undefined, undefined, '');
                } else if (filter.type === 'fileType') {
                  setFileType('');
                  updateUrl(undefined, undefined, undefined, '');
                } else if (filter.type === 'sort') {
                  setSort('');
                  updateUrl(undefined, undefined, undefined, undefined, '');
                }
              }}
            >
              {filter.label} ×
            </Badge>
          ))}
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      )}
    </Card>
  );
}
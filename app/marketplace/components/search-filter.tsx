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

interface SearchFilterProps {
  categories: string[];
}

export function SearchFilter({ categories }: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [type, setType] = useState(searchParams.get('type') || '');

  const updateUrl = (newSearch?: string, newCategory?: string, newType?: string) => {
    const params = new URLSearchParams();
    
    const searchValue = newSearch !== undefined ? newSearch : search;
    const categoryValue = newCategory !== undefined ? newCategory : category;
    const typeValue = newType !== undefined ? newType : type;
    
    if (searchValue) params.set('search', searchValue);
    if (categoryValue) params.set('category', categoryValue);
    if (typeValue) params.set('type', typeValue);
    
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
    router.push('/marketplace');
  };

  const activeFilters = [
    search && { type: 'search', value: search, label: `Search: "${search}"` },
    category && { type: 'category', value: category, label: `Category: ${category}` },
    type && { type: 'type', value: type, label: `Type: ${type === 'free' ? 'Free' : 'Premium'}` },
  ].filter((filter): filter is { type: string; value: string; label: string } => Boolean(filter));

  return (
    <Card className="p-4 space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Select value={category} onValueChange={(value) => {
          const newCategory = value === 'all' ? '' : value;
          setCategory(newCategory);
          updateUrl(undefined, newCategory);
        }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
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
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Premium</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit">Search</Button>
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
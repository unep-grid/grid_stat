import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import type { FilterState } from '@/lib/types';

interface FilterPanelProps {
  categories: string[];
  keywords: string[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function FilterPanel({
  categories,
  keywords,
  filters,
  onFilterChange,
}: FilterPanelProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFilterChange({ ...filters, search: value });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const toggleKeyword = (keyword: string) => {
    const newKeywords = filters.keywords.includes(keyword)
      ? filters.keywords.filter((k) => k !== keyword)
      : [...filters.keywords, keyword];
    onFilterChange({ ...filters, keywords: newKeywords });
  };

  const resetFilters = () => {
    setSearchInput('');
    onFilterChange({
      search: '',
      categories: [],
      keywords: [],
    });
  };

  const hasActiveFilters =
    filters.search || filters.categories.length > 0 || filters.keywords.length > 0;

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search indicators..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              className="shrink-0"
              title="Reset filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <Card
                  key={category}
                  className={`cursor-pointer p-2 transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  <p className="text-sm">{category}</p>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-medium">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Button
                  key={keyword}
                  variant={filters.keywords.includes(keyword) ? 'default' : 'outline'}
                  className="h-7 rounded-full text-xs"
                  onClick={() => toggleKeyword(keyword)}
                >
                  {keyword}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

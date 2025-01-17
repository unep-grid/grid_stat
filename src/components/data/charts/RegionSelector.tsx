import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { Language } from '@/lib/utils/translations';
import { t } from '@/lib/utils/translations';
import type { IndicatorData } from '@/lib/types';

interface RegionSelectorProps {
  allRegions: number[];
  selectedRegions: number[];
  setSelectedRegions: (regions: number[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
  language: Language;
  data: IndicatorData[]; // Add data prop to get region names
}

export function RegionSelector({ 
  allRegions, 
  selectedRegions, 
  setSelectedRegions,
  searchQuery,
  setSearchQuery,
  onClose,
  language,
  data
}: RegionSelectorProps) {
  const toggleRegion = (region: number) => {
    setSelectedRegions(
      selectedRegions.includes(region)
        ? selectedRegions.filter(r => r !== region)
        : [...selectedRegions, region].sort((a, b) => a - b)
    );
  };

  const filteredRegions = allRegions.filter(regionId => {
    const regionName = data.find(d => d.geo_entity_id === regionId)?.geo_entity || '';
    return regionName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('dv.search_regions', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
      </div>
      <ScrollArea className="h-[160px]">
        <div className="p-1">
          {filteredRegions.map((region) => (
            <div 
              key={region} 
              className="flex items-center space-x-2 px-1 py-0.5 hover:bg-muted/50 rounded-sm"
            >
              <Checkbox
                id={`region-${region}`}
                checked={selectedRegions.includes(region)}
                onCheckedChange={() => toggleRegion(region)}
                className="h-3 w-3"
              />
              <Label
                htmlFor={`region-${region}`}
                className="text-xs cursor-pointer flex-1"
              >
                {data.find(d => d.geo_entity_id === region)?.geo_entity || ''}
              </Label>
            </div>
          ))}
          {filteredRegions.length === 0 && (
            <div className="px-1 py-0.5 text-xs text-muted-foreground">
              {t('dv.no_regions_found', language)}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-2 border-t">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose}
          className="w-full h-7 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          {t('dv.close', language)}
        </Button>
      </div>
    </div>
  );
}

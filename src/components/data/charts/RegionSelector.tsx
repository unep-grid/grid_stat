import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { getRegionName } from '@/lib/utils/regions';

interface RegionSelectorProps {
  allRegions: number[];
  selectedRegions: number[];
  setSelectedRegions: (regions: number[]) => void;
}

export function RegionSelector({ 
  allRegions, 
  selectedRegions, 
  setSelectedRegions 
}: RegionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleRegion = (region: number) => {
    setSelectedRegions(
      selectedRegions.includes(region)
        ? selectedRegions.filter(r => r !== region)
        : [...selectedRegions, region].sort((a, b) => a - b)
    );
  };

  const selectAll = () => {
    setSelectedRegions([...allRegions]);
  };

  const selectNone = () => {
    setSelectedRegions([]);
  };

  const filteredRegions = allRegions.filter(region => 
    getRegionName(region)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <Label>Select Regions to Display</Label>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={selectAll}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={selectNone}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter regions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="h-[200px] rounded-md border">
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredRegions.map((region) => (
              <div key={region} className="flex items-center space-x-2">
                <Checkbox
                  id={`region-${region}`}
                  checked={selectedRegions.includes(region)}
                  onCheckedChange={() => toggleRegion(region)}
                />
                <Label
                  htmlFor={`region-${region}`}
                  className="text-sm cursor-pointer truncate"
                >
                  {getRegionName(region)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
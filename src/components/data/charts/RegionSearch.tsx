import { useState, useCallback } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface RegionSearchProps {
  regions: number[];
  selectedRegions: number[];
  onRegionToggle: (region: number) => void;
}

export function RegionSearch({ regions, selectedRegions, onRegionToggle }: RegionSearchProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const handleRegionSelect = useCallback((region: number) => {
    onRegionToggle(region);
    if (!selectedRegions.includes(region)) {
      setOpen(false);
    }
  }, [onRegionToggle, selectedRegions]);

  const filteredRegions = regions.filter((region) =>
    !search || `Region ${region}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedRegions.map((region) => (
          <Badge
            key={region}
            variant="secondary"
            className="flex items-center gap-1 py-1 px-3"
          >
            Region {region}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => onRegionToggle(region)}
            />
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Add Region
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search regions..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>No regions found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[300px]">
                    {filteredRegions.map((region) => (
                      <CommandItem
                        key={region}
                        onSelect={() => handleRegionSelect(region)}
                        className="flex items-center gap-2"
                      >
                        <div className="flex h-4 w-4 items-center justify-center">
                          {selectedRegions.includes(region) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <span>Region {region}</span>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
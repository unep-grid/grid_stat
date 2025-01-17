import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RegionSelector } from './RegionSelector';
import type { IndicatorData } from '@/lib/types';
import type { Language } from '@/lib/utils/translations';
import { t } from '@/lib/utils/translations';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, CheckSquare, Square } from 'lucide-react';

const colorPalette = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface DataChartProps {
  data: IndicatorData[];
  language: Language;
}

export function DataChart({ data, language }: DataChartProps) {
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Get unique regions and sort them by name
  const allRegions = useMemo(() => {
    const uniqueRegions = [...new Set(data.map(item => item.geo_entity_id))];
    return uniqueRegions.sort((a, b) => {
      const nameA = data.find(d => d.geo_entity_id === a)?.geo_entity || '';
      const nameB = data.find(d => d.geo_entity_id === b)?.geo_entity || '';
      return nameA.localeCompare(nameB);
    });
  }, [data]);

  // Select initial regions
  useEffect(() => {
    if (allRegions.length > 0 && selectedRegions.length === 0) {
      setSelectedRegions(allRegions.slice(0, Math.min(4, allRegions.length)));
    }
  }, [allRegions, selectedRegions.length]);

  // Get unit from data
  const unit = useMemo(() => {
    return data[0]?.unit || '';
  }, [data]);

  // Transform data for the chart
  const chartData = useMemo(() => {
    const yearMap = new Map();
    
    data.forEach(item => {
      if (!selectedRegions.includes(item.geo_entity_id)){
        return;
      }
      
      if (!yearMap.has(item.date_start)) {
        yearMap.set(item.date_start, { year: item.date_start });
      }
      
      const yearData = yearMap.get(item.date_start);
      yearData[item.geo_entity] = item.value;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [data, selectedRegions]);

  const selectAll = () => {
    setSelectedRegions([...allRegions]);
    setOpen(false);
  };

  const selectNone = () => {
    setSelectedRegions([]);
    setOpen(false);
  };

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('dv.no_data', language)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t('dv.filter_regions', language)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start" side="bottom" sideOffset={4}>
            <RegionSelector
              language={language}
              allRegions={allRegions}
              selectedRegions={selectedRegions}
              setSelectedRegions={setSelectedRegions}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onClose={() => setOpen(false)}
              data={data}
            />
          </PopoverContent>
        </Popover>
        <Button 
          variant="outline" 
          size="sm"
          onClick={selectAll}
          title={t('dv.select_all_regions', language)}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          {t('dv.select_all', language)}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={selectNone}
          title={t('dv.clear_selection', language)}
        >
          <Square className="h-4 w-4 mr-2" />
          {t('dv.clear', language)}
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <YAxis
              width={60}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'var(--background)', 
                borderRadius: '8px', 
                border: '1px solid var(--border)' 
              }}
              labelStyle={{ color: 'var(--foreground)' }}
              formatter={(value: number, name: string) => {
                const itemData = data.find(d => d.geo_entity === name && d.value === value);
                return [
                  `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`,
                  <>
                    <div>{name}</div>
                    {itemData?.attributes?.source_detail && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {itemData.attributes.source_detail}
                      </div>
                    )}
                  </>
                ];
              }}
            />
            <Legend />
            {selectedRegions.map((regionId, index) => {
              const regionName = data.find(d => d.geo_entity_id === regionId)?.geo_entity;
              if (!regionName) return null;
              return (
                <Line
                  key={regionId}
                  type="monotone"
                  dataKey={regionName}
                  stroke={colorPalette[index % colorPalette.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

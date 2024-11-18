import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RegionSelector } from './RegionSelector';
import { getRegionName } from '@/lib/utils/regions';
import type { IndicatorData } from '@/lib/types';

const colorPalette = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface DataChartProps {
  data: IndicatorData[];
}

export function DataChart({ data }: DataChartProps) {
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);

  // Get unique regions and sort them
  const allRegions = useMemo(() => {
    return [...new Set(data.map(item => item.m49_code))].sort((a, b) => a - b);
  }, [data]);

  // Select initial regions
  useEffect(() => {
    if (allRegions.length > 0 && selectedRegions.length === 0) {
      setSelectedRegions(allRegions.slice(0, Math.min(4, allRegions.length)));
    }
  }, [allRegions, selectedRegions.length]);

  // Transform data for the chart
  const chartData = useMemo(() => {
    const yearMap = new Map();
    
    data.forEach(item => {
      if (!selectedRegions.includes(item.m49_code)) return;
      
      if (!yearMap.has(item.date_start)) {
        yearMap.set(item.date_start, { year: item.date_start });
      }
      
      const yearData = yearMap.get(item.date_start);
      const regionName = getRegionName(item.m49_code);
      yearData[regionName] = item.value;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [data, selectedRegions]);

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-[400px]">
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
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'var(--background)', 
                borderRadius: '8px', 
                border: '1px solid var(--border)' 
              }}
              labelStyle={{ color: 'var(--foreground)' }}
              formatter={(value: number) => value.toLocaleString()}
            />
            <Legend />
            {selectedRegions.map((region, index) => (
              <Line
                key={region}
                type="monotone"
                dataKey={getRegionName(region)}
                stroke={colorPalette[index % colorPalette.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <RegionSelector
        allRegions={allRegions}
        selectedRegions={selectedRegions}
        setSelectedRegions={setSelectedRegions}
      />
    </div>
  );
}
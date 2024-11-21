import React, { useMemo, useState } from "react";
import { getRegionName } from "@/lib/utils/regions";
import type { IndicatorData } from "@/lib/types";
import type { Language } from "@/lib/utils/translations";
import { t } from "@/lib/utils/translations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

interface DataTableProps {
  data: IndicatorData[];
  language: Language;
}

interface ProcessedData {
  regionCode: number;
  regionName: string;
  latestYear: number;
  latestValue: number;
  minYear: number;
  maxYear: number;
  minValue: number;
  maxValue: number;
  historicalValues: number[];
  historicalYears: number[];
}

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const width = 60;
  const height = 20;
  const padding = 2;
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((value - minValue) / range) * (height - 2 * padding) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="text-red-500">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
};

export function DataTable({ data, language }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProcessedData;
    direction: 'asc' | 'desc';
  }>({
    key: 'latestValue',
    direction: 'desc'
  });

  const processedData = useMemo(() => {
    const regionMap = new Map<number, ProcessedData>();

    // Process data for each region
    data.forEach((item) => {
      if (!regionMap.has(item.m49_code)) {
        regionMap.set(item.m49_code, {
          regionCode: item.m49_code,
          regionName: getRegionName(item.m49_code),
          latestYear: item.date_start,
          latestValue: item.value,
          minYear: item.date_start,
          maxYear: item.date_start,
          minValue: item.value,
          maxValue: item.value,
          historicalValues: [item.value],
          historicalYears: [item.date_start]
        });
      } else {
        const region = regionMap.get(item.m49_code)!;
        region.historicalValues.push(item.value);
        region.historicalYears.push(item.date_start);
        
        // Update latest year and value
        if (item.date_start > region.latestYear) {
          region.latestYear = item.date_start;
          region.latestValue = item.value;
        }
        
        // Update min/max years
        region.minYear = Math.min(region.minYear, item.date_start);
        region.maxYear = Math.max(region.maxYear, item.date_start);
        
        // Update min/max values
        region.minValue = Math.min(region.minValue, item.value);
        region.maxValue = Math.max(region.maxValue, item.value);
      }
    });

    // Convert map to array and sort values
    let processedArray = Array.from(regionMap.values());
    processedArray.forEach(region => {
      // Sort historical values by year for sparkline
      const sorted = region.historicalYears
        .map((year, i) => ({ year, value: region.historicalValues[i] }))
        .sort((a, b) => a.year - b.year);
      
      region.historicalValues = sorted.map(item => item.value);
    });

    // Apply sorting
    processedArray.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return processedArray;
  }, [data, sortConfig]);

  const handleSort = (key: keyof ProcessedData) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof ProcessedData) => {
    if (sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border rounded-md h-full flex flex-col">
        <Table>
          <TableHeader className="bg-background">
            <TableRow className="border-b">
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50 text-left border-r"
                onClick={() => handleSort('regionName')}
              >
                <div className="flex items-center gap-2">
                  {t('dv.region', language)}
                  {getSortIcon('regionName')}
                </div>
              </TableHead>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50 text-right border-r"
                onClick={() => handleSort('minYear')}
              >
                <div className="flex items-center justify-end gap-2">
                  Min Year
                  {getSortIcon('minYear')}
                </div>
              </TableHead>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50 text-right border-r"
                onClick={() => handleSort('latestYear')}
              >
                <div className="flex items-center justify-end gap-2">
                  Latest Year
                  {getSortIcon('latestYear')}
                </div>
              </TableHead>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50 text-right border-r"
                onClick={() => handleSort('minValue')}
              >
                <div className="flex items-center justify-end gap-2">
                  Min Value
                  {getSortIcon('minValue')}
                </div>
              </TableHead>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50 text-right border-r"
                onClick={() => handleSort('latestValue')}
              >
                <div className="flex items-center justify-end gap-2">
                  Latest Value
                  {getSortIcon('latestValue')}
                </div>
              </TableHead>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50 text-right border-r"
                onClick={() => handleSort('maxValue')}
              >
                <div className="flex items-center justify-end gap-2">
                  Max Value
                  {getSortIcon('maxValue')}
                </div>
              </TableHead>
              <TableHead className="sticky top-0 bg-background z-10 w-[80px]" />
            </TableRow>
          </TableHeader>
        </Table>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableBody>
              {processedData.map((row) => (
                <TableRow key={row.regionCode} className="border-b">
                  <TableCell className="text-left border-r">{row.regionName}</TableCell>
                  <TableCell className="text-right border-r">{row.minYear}</TableCell>
                  <TableCell className="text-right border-r">{row.latestYear}</TableCell>
                  <TableCell className="text-right border-r">{row.minValue.toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-right border-r">
                    {row.latestValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right border-r">{row.maxValue.toLocaleString()}</TableCell>
                  <TableCell className="w-[80px]">
                    <Sparkline data={row.historicalValues} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

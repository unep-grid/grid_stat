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
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: IndicatorData[];
  language: Language;
}

interface ProcessedData {
  regionCode: number;
  regionName: string;
  mostRecentYear: number;
  mostRecentValue: number;
  historicalValues: number[];
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
    key: 'mostRecentValue',
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
          mostRecentYear: item.date_start,
          mostRecentValue: item.value,
          historicalValues: [item.value]
        });
      } else {
        const region = regionMap.get(item.m49_code)!;
        region.historicalValues.push(item.value);
        if (item.date_start > region.mostRecentYear) {
          region.mostRecentYear = item.date_start;
          region.mostRecentValue = item.value;
        }
      }
    });

    // Convert map to array and sort values
    let processedArray = Array.from(regionMap.values());
    processedArray.forEach(region => {
      region.historicalValues.sort((a, b) => a - b);
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
            <TableRow>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('regionName')}
              >
                <div className="flex items-center gap-2">
                  {t('dv.region', language)}
                  {getSortIcon('regionName')}
                </div>
              </TableHead>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('mostRecentYear')}
              >
                <div className="flex items-center gap-2">
                  {t('dv.year', language)}
                  {getSortIcon('mostRecentYear')}
                </div>
              </TableHead>
              <TableHead 
                className="sticky top-0 bg-background z-10 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('mostRecentValue')}
              >
                <div className="flex items-center gap-2">
                  {t('dv.value', language)}
                  {getSortIcon('mostRecentValue')}
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
                <TableRow key={row.regionCode}>
                  <TableCell>{row.regionName}</TableCell>
                  <TableCell>{row.mostRecentYear}</TableCell>
                  <TableCell className="font-medium">
                    {row.mostRecentValue.toLocaleString()}
                  </TableCell>
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

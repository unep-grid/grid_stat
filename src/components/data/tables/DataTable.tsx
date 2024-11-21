import React, { useMemo } from "react";
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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  createColumnHelper,
} from "@tanstack/react-table";

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
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'latestValue', desc: true }
  ]);

  const processedData = useMemo(() => {
    const regionMap = new Map<number, ProcessedData>();

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
        
        if (item.date_start > region.latestYear) {
          region.latestYear = item.date_start;
          region.latestValue = item.value;
        }
        
        region.minYear = Math.min(region.minYear, item.date_start);
        region.maxYear = Math.max(region.maxYear, item.date_start);
        region.minValue = Math.min(region.minValue, item.value);
        region.maxValue = Math.max(region.maxValue, item.value);
      }
    });

    let processedArray = Array.from(regionMap.values());
    processedArray.forEach(region => {
      const sorted = region.historicalYears
        .map((year, i) => ({ year, value: region.historicalValues[i] }))
        .sort((a, b) => a.year - b.year);
      
      region.historicalValues = sorted.map(item => item.value);
    });

    return processedArray;
  }, [data]);

  const columnHelper = createColumnHelper<ProcessedData>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('regionName', {
        header: () => t('dv.region', language),
        cell: info => (
          <div className="truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor('minYear', {
        header: 'Min Year',
        cell: info => info.getValue(),
        size: 100,
      }),
      columnHelper.accessor('latestYear', {
        header: 'Latest Year',
        cell: info => info.getValue(),
        size: 100,
      }),
      columnHelper.accessor('minValue', {
        header: 'Min Value',
        cell: info => info.getValue().toLocaleString(),
        size: 120,
      }),
      columnHelper.accessor('latestValue', {
        header: 'Latest Value',
        cell: info => info.getValue().toLocaleString(),
        size: 120,
      }),
      columnHelper.accessor('maxValue', {
        header: 'Max Value',
        cell: info => info.getValue().toLocaleString(),
        size: 120,
      }),
      columnHelper.accessor('historicalValues', {
        header: '',
        cell: info => <Sparkline data={info.getValue()} />,
        size: 80,
        enableSorting: false,
      }),
    ],
    [language]
  );

  const table = useReactTable({
    data: processedData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getSortIcon = (isSorted: false | 'asc' | 'desc') => {
    if (!isSorted) return <ChevronsUpDown className="h-4 w-4" />;
    return isSorted === 'asc' 
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border rounded-md h-full flex flex-col">
        <Table>
          <TableHeader className="bg-background">
            <TableRow className="border-b">
              {table.getFlatHeaders().map(header => {
                const isNumeric = header.id !== 'regionName' && header.id !== 'historicalValues';
                return (
                  <TableHead
                    key={header.id}
                    className={`sticky top-0 bg-background z-10 ${
                      header.column.getCanSort() ? 'cursor-pointer hover:bg-gray-50' : ''
                    } border-r`}
                    style={{ 
                      width: header.column.getSize(),
                      minWidth: header.column.getSize(),
                      maxWidth: header.column.getSize()
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className={`flex items-center gap-2 ${isNumeric ? 'justify-end' : 'justify-start'}`}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && getSortIcon(header.column.getIsSorted())}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
        </Table>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="border-b">
                  {row.getVisibleCells().map(cell => {
                    const isNumeric = cell.column.id !== 'regionName' && cell.column.id !== 'historicalValues';
                    return (
                      <TableCell
                        key={cell.id}
                        className={`border-r ${
                          cell.column.id === 'latestValue' ? 'font-medium' : ''
                        } ${isNumeric ? 'text-right' : 'text-left'}`}
                        style={{ 
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                          maxWidth: cell.column.getSize()
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

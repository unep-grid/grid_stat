import React, { useMemo } from "react";
import type { Indicator, IndicatorData } from "@/lib/types";
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
  indicator?: Indicator;
}

interface ProcessedData {
  geo_entity_id: number;
  geo_entity: string;
  latestYear: number;
  latestValue: number;
  minYear: number;
  maxYear: number;
  minValue: number;
  maxValue: number;
  historicalValues: number[];
  historicalYears: number[];
  unit: string;
  source_detail: string;
}

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const width = 60;
  const height = 20;
  const padding = 2;

  // Handle empty data or data with invalid values
  if (!data.length || data.some(v => isNaN(v) || !isFinite(v))) {
    return (
      <svg width={width} height={height} className="text-gray-300">
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      </svg>
    );
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  
  // If all values are the same, draw a horizontal line
  if (range === 0) {
    return (
      <svg width={width} height={height} className="text-red-500">
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    );
  }

  // Calculate points with valid range
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((value - minValue) / range) * (height - 2 * padding) - padding;
    return `${x},${Number.isFinite(y) ? y : height / 2}`;
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

const IndicatorInfo: React.FC<{ title?: string; unit: string }> = ({ title, unit }) => {
  return (
    <div className="mb-4 p-3">
      <div className="flex flex-col gap-1">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        <p className="text-sm">
          Unit: <span className="font-medium">{unit}</span>
        </p>
      </div>
    </div>
  );
};

export function DataTable({ data, language, indicator }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'latestValue', desc: true }
  ]);

  const processedData = useMemo(() => {
    const regionMap = new Map<number, ProcessedData>();

    data.forEach((item) => {
      // Skip items with invalid values
      if (
        item.value === null || 
        item.date_start === null || 
        !Number.isFinite(item.value) || 
        !Number.isFinite(item.date_start)
      ) return;

      const value = Number(item.value);
      const year = Number(item.date_start);

      if (!Number.isFinite(value) || !Number.isFinite(year)) return;

      if (!regionMap.has(item.geo_entity_id)) {
        regionMap.set(item.geo_entity_id, {
          geo_entity_id: item.geo_entity_id,
          geo_entity: item.geo_entity,
          latestYear: year,
          latestValue: value,
          minYear: year,
          maxYear: year,
          minValue: value,
          maxValue: value,
          historicalValues: [value],
          historicalYears: [year],
          unit: item.unit || '',
          source_detail: item.attributes?.source_detail || ''
        });
      } else {
        const region = regionMap.get(item.geo_entity_id)!;
        region.historicalValues.push(value);
        region.historicalYears.push(year);
        
        if (year > region.latestYear) {
          region.latestYear = year;
          region.latestValue = value;
        }
        
        region.minYear = Math.min(region.minYear, year);
        region.maxYear = Math.max(region.maxYear, year);
        region.minValue = Math.min(region.minValue, value);
        region.maxValue = Math.max(region.maxValue, value);
      }
    });

    let processedArray = Array.from(regionMap.values());
    processedArray.forEach(region => {
      // Filter out any invalid year-value pairs before sorting
      const validPairs = region.historicalYears
        .map((year, i) => ({ year, value: region.historicalValues[i] }))
        .filter(pair => 
          Number.isFinite(pair.year) && 
          Number.isFinite(pair.value)
        );

      // Sort by year and extract values
      const sorted = validPairs
        .sort((a, b) => a.year - b.year);
      
      region.historicalValues = sorted.map(item => item.value);
      
      // Update min/max/latest values based on cleaned data
      if (sorted.length > 0) {
        const latestPair = sorted[sorted.length - 1];
        region.latestYear = latestPair.year;
        region.latestValue = latestPair.value;
        region.minYear = sorted[0].year;
        region.maxYear = latestPair.year;
        region.minValue = Math.min(...sorted.map(p => p.value));
        region.maxValue = Math.max(...sorted.map(p => p.value));
      }
    });

    return processedArray;
  }, [data]);

  const columnHelper = createColumnHelper<ProcessedData>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('geo_entity', {
        header: () => t('dv.region', language),
        cell: info => (
          <div className="truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor('minYear', {
        header: () => t('dv.min_year', language),
        cell: info => info.getValue(),
        size: 100,
      }),
      columnHelper.accessor('latestYear', {
        header: () => t('dv.latest_year', language),
        cell: info => info.getValue(),
        size: 100,
      }),
      columnHelper.accessor('minValue', {
        header: info => t('dv.min_value', language),
        cell: info => (
          <div title={info.row.original.source_detail}>
            {info.getValue().toLocaleString()}
          </div>
        ),
        size: 120,
      }),
      columnHelper.accessor('latestValue', {
        header: () => t('dv.latest_value', language),
        cell: info => (
          <div title={info.row.original.source_detail}>
            {info.getValue().toLocaleString()}
          </div>
        ),
        size: 120,
      }),
      columnHelper.accessor('maxValue', {
        header: () => t('dv.max_value', language),
        cell: info => (
          <div title={info.row.original.source_detail}>
            {info.getValue().toLocaleString()}
          </div>
        ),
        size: 120,
      }),
      columnHelper.accessor('historicalValues', {
        header: () => t('dv.trend', language),
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

  // Get the unit from the first data item (should be consistent across all items)
  const unit = data[0]?.unit || '';
  const title = indicator?.name;
  return (
    <div className="h-full flex flex-col">
      <IndicatorInfo title={title} unit={unit} />
      <div className="border rounded-md">
      <Table className="h-full min-w-full border-collapse">
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="border-b shadow-[0_1px_2px_0_rgba(0,0,0,0.1)]">
              {table.getFlatHeaders().map(header => {
                const isNumeric = header.id !== 'geo_entity' && header.id !== 'historicalValues';
                return (
                  <TableHead
                    key={header.id}
                    className={`${
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
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} className="border-b">
                {row.getVisibleCells().map(cell => {
                  const isNumeric = cell.column.id !== 'geo_entity' && cell.column.id !== 'historicalValues';
                  return (
                    <TableCell
                      key={cell.id}
                      className={`border-r ${
                        cell.column.id === 'latestValue' ? 'font-medium' : ''
                      } ${isNumeric ? 'text-right' : 'text-left'}`}
                      title={isNumeric && cell.column.id !== 'minYear' && cell.column.id !== 'latestYear' ? cell.row.original.source_detail : undefined}
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
  );
}

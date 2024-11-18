import { getRegionName } from '@/lib/utils/regions';
import type { IndicatorData } from '@/lib/types';

interface DataTableProps {
  data: IndicatorData[];
}

export function DataTable({ data }: DataTableProps) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left">Year</th>
            <th className="p-2 text-left">Value</th>
            <th className="p-2 text-left">Region</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{row.date_start}</td>
              <td className="p-2">{row.value.toLocaleString()}</td>
              <td className="p-2">{getRegionName(row.m49_code)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
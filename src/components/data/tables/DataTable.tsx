import { getRegionName } from '@/lib/utils/regions';
import type { IndicatorData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps {
  data: IndicatorData[];
}

export function DataTable({ data }: DataTableProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="border rounded-md h-full flex flex-col">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="sticky top-0 bg-background z-10">Year</TableHead>
              <TableHead className="sticky top-0 bg-background z-10">Value</TableHead>
              <TableHead className="sticky top-0 bg-background z-10">Region</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.date_start}</TableCell>
                  <TableCell>{row.value.toLocaleString()}</TableCell>
                  <TableCell>{getRegionName(row.m49_code)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

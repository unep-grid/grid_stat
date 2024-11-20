import { getRegionName } from '@/lib/utils/regions';
import type { IndicatorData } from '@/lib/types';
import type { Language } from '@/lib/utils/translations';
import { t } from '@/lib/utils/translations';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps {
  data: IndicatorData[];
  language: Language;
}

export function DataTable({ data, language }: DataTableProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="border rounded-md h-full flex flex-col">
        <Table>
          <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="sticky top-0 bg-background z-10">{t('dv.year', language)}</TableHead>
              <TableHead className="sticky top-0 bg-background z-10">{t('dv.value', language)}</TableHead>
              <TableHead className="sticky top-0 bg-background z-10">{t('dv.region', language)}</TableHead>
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

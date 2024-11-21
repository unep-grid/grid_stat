import { Button } from "../ui/button";
import { Download } from "lucide-react";
import type { Indicator, IndicatorData } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";

interface DownloadPanelProps {
  indicator: Indicator;
  data: IndicatorData[];
  language: Language;
}

export function DownloadPanel({ indicator, data, language }: DownloadPanelProps) {
  const downloadFormats = [
    { id: 'csv', label: 'CSV', icon: Download },
    { id: 'json', label: 'JSON', icon: Download },
  ];

  const downloadData = (format: string) => {
    if (format === 'csv') {
      const csvContent = `data:text/csv;charset=utf-8,Year,Value,Region\n${data
        .map((row) => `${row.date_start},${row.value},${row.m49_code}`)
        .join('\n')}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${indicator.id}_data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'json') {
      const jsonContent = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const link = document.createElement('a');
      link.setAttribute('href', jsonContent);
      link.setAttribute('download', `${indicator.id}_data.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('dv.download_title', language)}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('dv.download_description', language)}
        </p>
      </div>

      <div className="grid gap-4">
        {downloadFormats.map((format) => (
          <Button
            key={format.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => downloadData(format.id)}
          >
            <format.icon className="mr-2 h-4 w-4" />
            {t(`dv.download_${format.id}`, language)}
          </Button>
        ))}
      </div>
    </div>
  );
}

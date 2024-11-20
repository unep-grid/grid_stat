import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DataChart } from './charts/DataChart';
import { DataTable } from './tables/DataTable';
import type { Indicator, IndicatorData } from '@/lib/types';
import type { Language } from '@/lib/utils/translations';
import { t } from '@/lib/utils/translations';

interface VisualizationPanelProps {
  indicator: Indicator | null;
  data: IndicatorData[];
  language: Language;
}

export function VisualizationPanel({ indicator, data, language }: VisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState('chart');

  if (!indicator) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('dv.select_indicator_view', language)}</p>
      </div>
    );
  }

  const downloadData = () => {
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
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="shrink-0 flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">{indicator.title}</h2>
          <p className="text-sm text-muted-foreground mt-2">{indicator.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadData}>
          <Download className="mr-2 h-4 w-4" />
          {t('dv.download', language)}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="chart">{t('dv.chart', language)}</TabsTrigger>
          <TabsTrigger value="table">{t('dv.table', language)}</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 min-h-0 relative mt-4">
          <TabsContent 
            value="chart" 
            className="absolute inset-0 m-0 data-[state=active]:block"
          >
            <DataChart data={data} language={language} />
          </TabsContent>
          <TabsContent 
            value="table" 
            className="absolute inset-0 m-0 data-[state=active]:block overflow-hidden"
          >
            <DataTable data={data} language={language} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

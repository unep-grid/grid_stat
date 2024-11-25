import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DataChart } from './charts/DataChart';
import { DataTable } from './tables/DataTable';
import { MetaDataPanel } from './MetaDataPanel';
import { MapPanel } from './MapPanel';
import { DownloadPanel } from './DownloadPanel';
import { ThemeProvider } from '../layout/ThemeProvider';
import type { Indicator, IndicatorData } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";

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

  return (
    <div className="h-full flex flex-col p-4">
      <div className="shrink-0 mb-6">
        <h2 className="text-2xl font-semibold">{indicator.title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{indicator.description}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0">
          <TabsTrigger value="chart">{t('dv.chart', language)}</TabsTrigger>
          <TabsTrigger value="table">{t('dv.table', language)}</TabsTrigger>
          <TabsTrigger value="metadata">{t('dv.metadata', language)}</TabsTrigger>
          <TabsTrigger value="map">{t('dv.map', language)}</TabsTrigger>
          <TabsTrigger value="download">{t('dv.download', language)}</TabsTrigger>
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

          <TabsContent 
            value="metadata" 
            className="absolute inset-0 m-0 data-[state=active]:block overflow-y-auto"
          >
            <MetaDataPanel indicator={indicator} language={language} />
          </TabsContent>

          <TabsContent 
            value="map" 
            className="absolute inset-0 m-0 data-[state=active]:block"
          >
            <ThemeProvider>
              <MapPanel data={data} language={language} />
            </ThemeProvider>
          </TabsContent>

          <TabsContent 
            value="download" 
            className="absolute inset-0 m-0 data-[state=active]:block overflow-y-auto"
          >
            <DownloadPanel indicator={indicator} data={data} language={language} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

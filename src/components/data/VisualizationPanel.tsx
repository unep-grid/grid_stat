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
  const [activeTab, setActiveTab] = useState('metadata');

  if (!indicator) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t('dv.select_indicator_view', language)}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="shrink-0 border-b">
          <TabsList className="w-full justify-start h-16 bg-transparent p-0">
            <TabsTrigger value="metadata" className="data-[state=active]:bg-background">{t('dv.metadata', language)}</TabsTrigger>
            <TabsTrigger value="chart" className="data-[state=active]:bg-background">{t('dv.chart', language)}</TabsTrigger>
            <TabsTrigger value="table" className="data-[state=active]:bg-background">{t('dv.table', language)}</TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-background">{t('dv.map', language)}</TabsTrigger>
            <TabsTrigger value="download" className="data-[state=active]:bg-background">{t('dv.download', language)}</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 min-h-0 relative">
          <TabsContent 
            value="metadata" 
            className="absolute inset-0 m-0 data-[state=active]:block overflow-y-auto"
          >
            <div className="space-y-6 p-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{indicator.name}</h2>
              </div>
              <MetaDataPanel indicator={indicator} language={language} data={data} />
            </div>
          </TabsContent>

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
            <DataTable indicator={indicator} data={data} language={language} />
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

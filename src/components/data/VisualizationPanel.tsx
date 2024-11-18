import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DataChart } from './charts/DataChart';
import { DataTable } from './tables/DataTable';
import type { Indicator, IndicatorData } from '@/lib/types';

interface VisualizationPanelProps {
  indicator: Indicator | null;
  data: IndicatorData[];
}

export function VisualizationPanel({ indicator, data }: VisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState('chart');

  if (!indicator) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select an indicator to view data</p>
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
    <div className="h-full p-4">
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{indicator.title}</CardTitle>
              <CardDescription className="mt-2">{indicator.description}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={downloadData}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-2rem)]">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="h-full pt-4">
              <DataChart data={data} />
            </TabsContent>
            <TabsContent value="table" className="h-full pt-4">
              <DataTable data={data} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
import { Button } from "../ui/button";
import { Download, FileJson, FileText } from "lucide-react";
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
    { id: 'csv', label: 'CSV', icon: FileText },
    { id: 'json', label: 'JSON', icon: FileJson },
    { id: 'metadata', label: 'Metadata', icon: Download },
  ];

  const createCsvContent = () => {
    // Get all unique dimension names
    const dimensionNames = new Set<string>();
    data.forEach(row => {
      row.dimensions.forEach(dim => {
        dimensionNames.add(dim.dimension);
      });
    });

    // Create headers
    const headers = [
      'Year',
      'End Year',
      'Region ID',
      'Region Name',
      'Value',
      'Unit',
      ...Array.from(dimensionNames),
      'Source',
      'Nature',
      'Footnotes',
    ];

    // Create CSV rows
    const rows = data.map(row => {
      const dimensionValues: Record<string, string> = {};
      row.dimensions.forEach(dim => {
        dimensionValues[dim.dimension] = dim.value;
      });

      return [
        row.date_start,
        row.date_end,
        row.geo_entity_id,
        row.geo_entity,
        row.value ?? '',
        row.unit,
        ...Array.from(dimensionNames).map(dim => dimensionValues[dim] || ''),
        row.attributes.source_detail,
        row.attributes.nature,
        row.attributes.footnotes,
      ];
    });

    return `${headers.join(',')}\n${rows.map(row => row.join(',')).join('\n')}`;
  };

  const createMetadataContent = () => {
    const metadata = {
      indicator: {
        id: indicator.id,
        name: indicator.name,
        description: indicator.description,
        type: indicator.type,
        topics: indicator.topics,
        collections: indicator.collections.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
        })),
        sources: indicator.sources.map(s => ({
          name: s.name,
          name_short: s.name_short,
          citation: s.citation,
          contact: s.contact,
          url: s.url,
        })),
        keywords: indicator.keywords,
        source_url: indicator.source_url,
      },
      data_info: {
        total_records: data.length,
        time_range: {
          start: Math.min(...data.map(d => d.date_start)),
          end: Math.max(...data.map(d => d.date_end)),
        },
        unit: data[0]?.unit,
        dimensions: Array.from(new Set(data.flatMap(d => d.dimensions.map(dim => dim.dimension)))),
      },
    };

    return JSON.stringify(metadata, null, 2);
  };

  const downloadData = (format: string) => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'csv':
        content = `data:text/csv;charset=utf-8,${encodeURIComponent(createCsvContent())}`;
        filename = `${indicator.name}_data.csv`;
        mimeType = 'text/csv';
        break;
      case 'json':
        content = `data:application/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2)
        )}`;
        filename = `${indicator.name}_data.json`;
        mimeType = 'application/json';
        break;
      case 'metadata':
        content = `data:application/json;charset=utf-8,${encodeURIComponent(
          createMetadataContent()
        )}`;
        filename = `${indicator.name}_metadata.json`;
        mimeType = 'application/json';
        break;
      default:
        return;
    }

    const blob = new Blob([decodeURIComponent(content.split(',')[1])], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('dv.download_title', language)}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('dv.download_description', language)}
        </p>
      </div>

      <div className="space-y-4">
        {downloadFormats.map((format) => (
          <div key={format.id}>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => downloadData(format.id)}
            >
              <format.icon className="mr-2 h-4 w-4" />
              {t(`dv.download_${format.id}`, language)}
            </Button>
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              {t(`dv.download_${format.id}_description`, language)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">{t('dv.download_citation', language)}</h4>
        {indicator.sources.map((source, index) => (
          source.citation && (
            <p key={index} className="text-sm text-muted-foreground mb-2">
              {source.citation}
            </p>
          )
        ))}
      </div>
    </div>
  );
}

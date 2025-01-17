import { useMemo } from "react";
import type { Indicator, IndicatorData } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";
import { Card } from "../ui/card";
import { ExternalLink } from "lucide-react";

interface MetaDataPanelProps {
  indicator: Indicator;
  language: Language;
  data?: IndicatorData[];
}

export function MetaDataPanel({ indicator, language, data = [] }: MetaDataPanelProps) {
  // Extract unique dimensions grouped by dimension type
  const dimensionGroups = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    
    data.forEach((item) => {
      item.dimensions.forEach((dim: { dimension: string; value: string }) => {
        if (!groups.has(dim.dimension)) {
          groups.set(dim.dimension, new Set());
        }
        groups.get(dim.dimension)?.add(dim.value);
      });
    });

    return Array.from(groups.entries()).map(([dimension, values]) => ({
      dimension,
      values: Array.from(values).sort(),
    })) as Array<{ dimension: string; values: string[] }>;
  }, [data]);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{indicator.description}</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_collections', language)}</h3>
        <div className="space-y-4">
          {indicator.collections.map((collection) => (
            <Card key={collection.id} className="p-4">
              <h4 className="font-medium mb-1">{collection.name}</h4>
              <p className="text-sm text-muted-foreground">{collection.description}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_topics', language)}</h3>
        <div className="flex flex-wrap gap-2">
          {indicator.topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_keywords', language)}</h3>
        <div className="flex flex-wrap gap-2">
          {indicator.keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm font-medium"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_sources', language)}</h3>
        <div className="space-y-4">
          {indicator.sources.map((source) => (
            <Card key={source.name} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{source.name}</h4>
                  {source.name_short && (
                    <p className="text-sm text-muted-foreground mb-2">{source.name_short}</p>
                  )}
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {source.citation && (
                <div className="mt-2">
                  <p className="text-sm italic">{source.citation}</p>
                </div>
              )}
              {source.contact && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">{t('dv.metadata_contact', language)}: {source.contact}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {dimensionGroups.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_dimensions', language)}</h3>
          <div className="space-y-4">
            {dimensionGroups.map(({ dimension, values }) => (
              <Card key={dimension} className="p-4">
                <h4 className="font-medium mb-2">{dimension}</h4>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <span
                      key={value}
                      className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-sm"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_additional', language)}</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('dv.metadata_type', language)}</span>
            <span className="text-sm text-muted-foreground">{indicator.type}</span>
          </div>
          {indicator.source_url && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('dv.metadata_source_url', language)}</span>
              <a
                href={indicator.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {t('dv.metadata_visit_source', language)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

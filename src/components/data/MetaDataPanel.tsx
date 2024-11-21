import type { Indicator } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";

interface MetaDataPanelProps {
  indicator: Indicator;
  language: Language;
}

export function MetaDataPanel({ indicator, language }: MetaDataPanelProps) {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_description', language)}</h3>
        <p className="text-sm text-muted-foreground">{indicator.description}</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">{t('dv.metadata_collections', language)}</h3>
        <div className="space-y-2">
          {indicator.collections.map((collection) => (
            <div key={collection.title} className="text-sm">
              {collection.title}
            </div>
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
    </div>
  );
}

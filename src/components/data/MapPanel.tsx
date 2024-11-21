import type { IndicatorData } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";

interface MapPanelProps {
  data: IndicatorData[];
  language: Language;
}

export function MapPanel({ data, language }: MapPanelProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground">{t('dv.map_coming_soon', language)}</p>
    </div>
  );
}

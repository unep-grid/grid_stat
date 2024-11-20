import { ScrollArea } from '@/components/ui/scroll-area';
import { IndicatorCard } from './IndicatorCard';
import type { Indicator } from '@/lib/types';
import type { Language } from '@/lib/utils/translations';
import { t } from '@/lib/utils/translations';

interface IndicatorListProps {
  language: Language;
  indicators: Indicator[];
  selectedIndicator: Indicator | null;
  onSelectIndicator: (indicator: Indicator) => void;
  loading: boolean;
  error: string | null;
}

export function IndicatorList({
  language,
  indicators,
  selectedIndicator,
  onSelectIndicator,
  loading,
  error,
}: IndicatorListProps) {
  if (loading) {
    return (
      <div className="h-full p-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dv.indicators', language)}</h2>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-lg bg-muted"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('dv.indicators', language)}</h2>
            <span className="text-sm text-muted-foreground">
              {indicators.length} {t('dv.results', language)}
            </span>
          </div>
          <div className="space-y-4">
            {indicators.map((indicator) => (
              <IndicatorCard
                key={indicator.id}
                language={language}
                indicator={indicator}
                isSelected={selectedIndicator?.id === indicator.id}
                onClick={() => onSelectIndicator(indicator)}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

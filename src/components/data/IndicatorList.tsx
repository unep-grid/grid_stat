import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";
import { IndicatorCard } from './IndicatorCard';
import { IndicatorListItem } from './IndicatorListItem';
import type { Indicator } from '@/lib/types';
import type { Language } from '@/lib/utils/translations';
import { t } from '@/lib/utils/translations';
import { useState } from 'react';

type ViewMode = 'card' | 'list';

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

  const [viewMode, setViewMode] = useState<ViewMode>('card');

  return (
    <div className="relative flex h-full flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('dv.indicators', language)}</h2>
              <span className="text-sm text-muted-foreground">
                {indicators.length} {t('dv.results', language)}
              </span>
            </div>
            <div className={viewMode === 'card' ? 'space-y-4' : 'space-y-1'}>
              {indicators.map((indicator) => (
                viewMode === 'card' ? (
                  <IndicatorCard
                    key={indicator.id}
                    language={language}
                    indicator={indicator}
                    isSelected={selectedIndicator?.id === indicator.id}
                    onClick={() => onSelectIndicator(indicator)}
                  />
                ) : (
                  <IndicatorListItem
                    key={indicator.id}
                    indicator={indicator}
                    isSelected={selectedIndicator?.id === indicator.id}
                    onClick={() => onSelectIndicator(indicator)}
                  />
                )
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="sticky bottom-0 flex justify-center border-t bg-background p-2">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          size="sm"
        >
          <ToggleGroupItem value="card" aria-label="Card view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

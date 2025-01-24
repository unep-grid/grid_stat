import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";
import { IndicatorCard } from "./IndicatorCard";
import type { Indicator } from "@/lib/types";
import type { Language } from "@/lib/utils/translations";
import { t } from "@/lib/utils/translations";
import { useState } from "react";

type ViewMode = "card" | "list";

interface IndicatorListProps {
  language: Language;
  indicators: Indicator[];
  selectedIndicator: Indicator | null;
  onSelectIndicator: (indicator: Indicator) => void;
  loading: boolean;
  error: string | null;
  estimatedTotalHits?: number;
  processingTimeMs?: number;
}

export function IndicatorList({
  language,
  indicators,
  selectedIndicator,
  onSelectIndicator,
  loading,
  error,
  estimatedTotalHits,
  processingTimeMs,
}: IndicatorListProps) {
  if (loading) {
    return (
      <div className="h-full p-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {t("dv.indicators", language)}
          </h2>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted" />
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

  const [viewMode, setViewMode] = useState<ViewMode>("card");

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div id="indicator_list_header" className="sticky top-0 z-10 bg-background p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold min-w-0 flex-1 truncate">
              {t("dv.indicators", language)}
            </h2>
            <div className="flex-none">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) =>
                  value && setViewMode(value as ViewMode)
                }
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
        </div>
        <div className="p-4 max-w-full">
          <div className="space-y-4">
            <div
              className={`${viewMode === "card" ? "space-y-4" : "space-y-1"}`}
            >
              {indicators.map((indicator) => (
                <IndicatorCard
                  key={indicator.id}
                  language={language}
                  indicator={indicator}
                  isSelected={selectedIndicator?.id === indicator.id}
                  onClick={() => onSelectIndicator(indicator)}
                  mode={viewMode}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="sticky bottom-0 border-t bg-background p-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {indicators.length} {t("dv.results", language)}
            {estimatedTotalHits !== undefined &&
              estimatedTotalHits !== indicators.length &&
              ` of ${estimatedTotalHits}`}
          </span>
          {processingTimeMs !== undefined && (
            <span>{(processingTimeMs / 1000).toFixed(2)}s</span>
          )}
        </div>
      </div>
    </div>
  );
}

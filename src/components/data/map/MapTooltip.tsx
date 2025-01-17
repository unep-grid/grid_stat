import { cn } from "@/lib/utils";
import { t } from "@/lib/utils/translations";
import type { Language } from "@/lib/utils/translations";

interface MapTooltipProps {
  regionName: string;
  value: number;
  unit?: string;
  source?: string;
  language: Language;
  x: number;
  y: number;
  visible: boolean;
}

export function MapTooltip({ regionName, value, unit, source, language, x, y, visible }: MapTooltipProps) {
  const formattedValue = `${new Intl.NumberFormat(language).format(value)}${unit ? ` ${unit}` : ''}`;

  return (
    <div
      className={cn(
        "absolute z-50 pointer-events-none",
        "bg-popover text-popover-foreground",
        "rounded-md border shadow-md",
        "px-3 py-2",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center gap-2">
          <span className="text-sm font-medium">{t("dv.region", language)}:</span>
          <span className="text-sm">{regionName}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-sm font-medium">{t("dv.value", language)}:</span>
          <span className="text-sm">{formattedValue}</span>
        </div>
        {source && (
          <div className="text-xs text-muted-foreground mt-1 border-t pt-1">
            {source}
          </div>
        )}
      </div>
    </div>
  );
}

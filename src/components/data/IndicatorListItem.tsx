import { BarChart3 } from "lucide-react";
import type { Indicator } from "@/lib/types";

interface IndicatorListItemProps {
  indicator: Indicator;
  isSelected: boolean;
  onClick: () => void;
}

export function IndicatorListItem({
  indicator,
  isSelected,
  onClick,
}: IndicatorListItemProps) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted ${
        isSelected ? "bg-muted" : ""
      }`}
      onClick={onClick}
    >
      {indicator.type === 'statistical' && (
        <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{indicator.name}</span>
    </div>
  );
}

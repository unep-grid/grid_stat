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
      className={`flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted overflow-hidden ${
        isSelected ? "bg-muted" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {indicator.type === 'statistical' && (
          <BarChart3 className="h-4 w-4 flex-none text-muted-foreground" />
        )}
        <span className="truncate overflow-hidden">{indicator.name}</span>
      </div>
    </div>
  );
}

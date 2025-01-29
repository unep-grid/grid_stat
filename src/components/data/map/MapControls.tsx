import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export function MapControls({ onZoomIn, onZoomOut, onMove }: MapControlsProps) {
  const { colors } = useTheme();

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg shadow-lg">
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomIn}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onZoomOut}
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMove('up')}
          className="h-8 w-8"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMove('left')}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMove('right')}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMove('down')}
          className="h-8 w-8"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <div />
      </div>
    </div>
  );
}

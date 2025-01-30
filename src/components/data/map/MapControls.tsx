import { useTheme } from "@/components/layout/ThemeProvider";
import { GeoZoom } from "@fxi/d3-geo-zoom";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Home,
  Navigation,
} from "lucide-react";
import * as d3 from "d3";

interface MapControlsProps {
  geoZoom: GeoZoom | null;
  svg: SVGSVGElement | null;
  northUp: boolean;
  onNorthUpChange: (enabled: boolean) => void;
}

export function MapControls({
  geoZoom,
  svg,
  northUp,
  onNorthUpChange,
}: MapControlsProps) {
  const { colors } = useTheme();

  const handleZoom = (scale: number) => {
    if (!geoZoom || !svg) return;
    const zoom = geoZoom.getZoom();
    const selection = d3.select(svg);
    selection.transition().call(zoom.scaleBy, scale);
  };

  const handleMove = (direction: "left" | "right" | "up" | "down") => {
    if (!geoZoom) return;
    geoZoom.move(direction, 45);
  };

  const handleReset = () => {
    if (!geoZoom) return;
    geoZoom.reset();
  };

  const handleNorthUpToggle = () => {
    if (!geoZoom) return;
    const newState = !northUp;
    onNorthUpChange(newState);
    geoZoom.setNorthUp(newState);
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
      <div className="grid gap-1">
        {/* Zoom controls */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleZoom(1.1)}
            className="p-1.5 rounded bg-accent/80 hover:bg-accent text-accent-foreground text-sm"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => handleZoom(0.9)}
            className="p-1.5 rounded bg-accent/80 hover:bg-accent text-accent-foreground text-sm"
            title="Zoom out"
          >
            −
          </button>
        </div>

        {/* Direction controls */}
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button
            onClick={() => handleMove("up")}
            className="p-1.5 rounded bg-accent/80 hover:bg-accent text-accent-foreground text-sm"
            title="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <div />
          <button
            onClick={() => handleMove("left")}
            className="p-1.5 rounded bg-accent/80 hover:bg-accent text-accent-foreground text-sm"
            title="Move left"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded bg-accent/80 hover:bg-accent text-accent-foreground text-sm"
            title="Reset view"
          >
            <Home className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleMove("right")}
            className="p-1.5 rounded bg-accent/80 hover:bg-accent text-accent-foreground text-sm"
            title="Move right"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div />
          <button
            onClick={() => handleMove("down")}
            className="p-1.5 rounded bg-accent/80 hover:bg-accent text-accent-foreground text-sm"
            title="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <div />
        </div>

        {/* North up toggle */}
        <button
          onClick={handleNorthUpToggle}
          className={`p-1.5 rounded text-sm ${
            northUp
              ? "bg-primary text-primary-foreground"
              : "bg-accent/80 hover:bg-accent text-accent-foreground"
          }`}
          title="Toggle north up"
        >
          <Navigation className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

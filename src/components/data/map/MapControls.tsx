import { useTheme } from "@/components/layout/ThemeProvider";
import type { ProjectionType } from "./types";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onNorthUpToggle: () => void;
  isNorthUp: boolean;
  currentProjection: ProjectionType;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onNorthUpToggle,
  isNorthUp,
  currentProjection,
}: MapControlsProps) {
  const { colors } = useTheme();

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="p-2 rounded-lg hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        title="Zoom in"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.foreground}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </button>

      <button
        onClick={onZoomOut}
        className="p-2 rounded-lg hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        title="Zoom out"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.foreground}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </button>

      <button
        onClick={onRotateLeft}
        className="p-2 rounded-lg hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        title="Rotate left"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.foreground}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12c0 5 4 9 9 9s9-4 9-9-4-9-9-9" />
          <path d="M11 3L7 7l4 4" />
        </svg>
      </button>

      <button
        onClick={onRotateRight}
        className="p-2 rounded-lg hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        title="Rotate right"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.foreground}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12c0 5-4 9-9 9s-9-4-9-9 4-9 9-9" />
          <path d="M13 3l4 4-4 4" />
        </svg>
      </button>

      <button
        onClick={onNorthUpToggle}
        className={`p-2 rounded-lg hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/20 ${
          isNorthUp ? "bg-foreground/10" : ""
        }`}
        title="North up"
        disabled={currentProjection !== "Orthographic"}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.foreground}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={currentProjection !== "Orthographic" ? "opacity-50" : ""}
        >
          <path d="M12 2v20M12 2l4 4M12 2L8 6" />
        </svg>
      </button>
    </div>
  );
}

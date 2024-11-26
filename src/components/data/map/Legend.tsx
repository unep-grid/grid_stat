import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import type { ProjectionType } from "./types";
import { projections } from "./types";

interface LegendProps {
  globalExtent: [number, number];
  currentProjection: ProjectionType;
  onProjectionChange: (projection: ProjectionType) => void;
}

export function Legend({
  globalExtent,
  currentProjection,
  onProjectionChange,
}: LegendProps) {
  return (
    <div className="flex items-center justify-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span>{globalExtent[0].toLocaleString()}</span>
        <div
          className="h-2 w-40 rounded"
          style={{
            background: "url(#color-gradient)",
          }}
        >
          <svg width="100%" height="100%">
            <rect width="100%" height="100%" fill="url(#color-gradient)" />
          </svg>
        </div>
        <span>{globalExtent[1].toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width="20" height="10">
          <rect width="20" height="10" fill="url(#hatch)" />
        </svg>
        <span className="text-muted-foreground">No data</span>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={currentProjection}
          onValueChange={(value: ProjectionType) => onProjectionChange(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select projection" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(projections).map((proj) => (
              <SelectItem key={proj} value={proj}>
                {proj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Map, LayoutList, Download, Star } from "lucide-react";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "../../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { TimeControl } from "./TimeControl";
import type { ProjectionType } from "./types";
import { primaryProjections, additionalProjections } from "./projections";

interface MapToolbarProps {
  currentProjection: ProjectionType;
  onProjectionChange: (value: ProjectionType) => void;
  onExportSVG: () => void;
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  onLatestToggle: (isLatest: boolean) => void;
}

export function MapToolbar({
  currentProjection,
  onProjectionChange,
  onExportSVG,
  years,
  selectedYear,
  onYearChange,
  onLatestToggle,
}: MapToolbarProps) {
  return (
    <div className="map-toolbar flex items-center justify-between p-2 border-b bg-background">
      <div className="flex items-center space-x-2">
        {/* Projection Selector */}
        <Select
          value={currentProjection}
          onValueChange={(value: ProjectionType) => onProjectionChange(value)}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select Projection">
              <div className="flex items-center">
                <Map className="mr-2 h-4 w-4" />
                {currentProjection}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {/* Primary Projections */}

            {primaryProjections.map((proj) => (
              <SelectItem
                key={proj.name}
                value={proj.name}
                className="relative pr-8"
              >
                {proj.name}
                <Star className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500 fill-yellow-500" />
              </SelectItem>
            ))}

            {/* Separator */}
            <SelectSeparator />

            {/* Additional Projections */}
            {additionalProjections.map((proj) => (
              <SelectItem key={proj.name} value={proj.name}>
                {proj.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export SVG */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onExportSVG}>
                <Download className="h-4 w-4" />
                <span className="sr-only">Export SVG</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Map as SVG</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Time Control */}
      <TimeControl
        years={years}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
        onLatestToggle={onLatestToggle}
      />
    </div>
  );
}

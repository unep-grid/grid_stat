import { useState } from "react";
import { Map, LayoutList, Download } from "lucide-react";
import { Button } from "../../ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";
import { TimeControl } from "./TimeControl";
import type { ProjectionType } from "./types";

interface MapToolbarProps {
  projections: { name: ProjectionType; value: any }[];
  currentProjection: ProjectionType;
  onProjectionChange: (value: ProjectionType) => void;
  isLegendVisible: boolean;
  onLegendToggle: () => void;
  onExportSVG: () => void;
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  onLatestToggle: (isLatest: boolean) => void;
}

export function MapToolbar({
  projections,
  currentProjection,
  onProjectionChange,
  isLegendVisible,
  onLegendToggle,
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Projection">
              <div className="flex items-center">
                <Map className="mr-2 h-4 w-4" />
                {currentProjection}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projections.map((proj) => (
              <SelectItem key={proj.name} value={proj.name} >
                {proj.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Legend Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isLegendVisible ? "default" : "outline"}
                size="icon" 
                onClick={onLegendToggle}
              >
                <LayoutList className="h-4 w-4" />
                <span className="sr-only">Toggle Legend</span>
              </Button>  
            </TooltipTrigger>
            <TooltipContent>
              <p>{isLegendVisible ? "Hide" : "Show"} Legend</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Export SVG */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onExportSVG}
              >
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

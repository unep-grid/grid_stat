import React, { useState } from 'react';
import { Slider } from "../../ui/slider";
import { Button } from "../../ui/button";
import { Calendar, CalendarOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

interface TimeControlProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  onLatestToggle: (isLatest: boolean) => void;
}

export function TimeControl({ 
  years, 
  selectedYear, 
  onYearChange,
  onLatestToggle
}: TimeControlProps) {
  const [isLatest, setIsLatest] = useState(false);

  const handleYearChange = (values: number[]) => {
    if (!isLatest) {
      const yearIndex = values[0];
      onYearChange(years[yearIndex]);
    }
  };

  const handleLatestToggle = () => {
    const newIsLatest = !isLatest;
    setIsLatest(newIsLatest);
    onLatestToggle(newIsLatest);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-4 w-full">
        {/* Latest Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isLatest ? "default" : "outline"}
              size="icon"
              onClick={handleLatestToggle}
            >
              {isLatest ? <CalendarOff className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              <span className="sr-only">Toggle Latest</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isLatest ? "Showing latest available data" : "Show historical data"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Year Labels */}
        <span>{years[0]}</span>

        {/* Year Slider */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex-grow min-w-[150px] ${isLatest ? 'opacity-50' : ''}`}>
              <Slider
                value={[years.indexOf(selectedYear)]}
                onValueChange={handleYearChange}
                max={years.length - 1}
                step={1}
                disabled={isLatest}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Selected Year: {selectedYear}</p>
          </TooltipContent>
        </Tooltip>

        <span>{years[years.length - 1]}</span>
      </div>
    </TooltipProvider>
  );
}

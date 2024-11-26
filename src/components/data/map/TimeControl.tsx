import React, { useState } from 'react';
import { Slider } from "../../ui/slider";
import { Button } from "../../ui/button";
import { AlarmClockMinus, AlarmClockPlus } from "lucide-react";

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
    <div className="flex items-center space-x-4 w-full">
      {/* Latest Toggle Button */}
      <Button
        variant={isLatest ? "default" : "outline"}
        size="icon"
        onClick={handleLatestToggle}
      >
        {isLatest ? <AlarmClockMinus className="h-4 w-4" /> : <AlarmClockPlus className="h-4 w-4" />}
        <span className="sr-only">Toggle Latest</span>
      </Button>

      {/* Year Slider */}
      <div className="flex-grow min-w-[150px]">
        <Slider
          value={[years.indexOf(selectedYear)]}
          onValueChange={handleYearChange}
          max={years.length - 1}
          step={1}
          disabled={isLatest}
        />
      </div>

      {/* Year Labels */}
      <div className="flex space-x-2">
        <span>{years[0]}</span>
        <span>{selectedYear}</span>
        <span>{years[years.length - 1]}</span>
      </div>
    </div>
  );
}

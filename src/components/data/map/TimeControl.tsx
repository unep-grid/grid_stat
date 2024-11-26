import React from "react";
import { Slider } from "../../ui/slider";

interface TimeControlProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function TimeControl({
  years,
  selectedYear,
  onYearChange,
}: TimeControlProps) {
  return (
    <>
      {/* Title Section */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-semibold">{selectedYear}</h2>
      </div>

      {/* Time Slider Section */}
      <div className="flex flex-col gap-2 px-8">
        <Slider
          value={[selectedYear]}
          min={years[0]}
          max={years[years.length - 1]}
          step={1}
          onValueChange={(value) => onYearChange(value[0])}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{years[0]}</span>
          <span>{years[years.length - 1]}</span>
        </div>
      </div>
    </>
  );
}

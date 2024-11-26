import React from 'react';
import { Slider } from "@/components/ui/slider";

interface TimeControlProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function TimeControl({ 
  years, 
  selectedYear, 
  onYearChange 
}: TimeControlProps) {
  return (
    <div className="flex items-center space-x-4 w-full">
      {/* Year Slider */}
      <div className="flex-grow min-w-[200px]">
        <Slider
          value={[years.indexOf(selectedYear)]}
          onValueChange={(values) => onYearChange(years[values[0]])}
          max={years.length - 1}
          step={1}
        />
      </div>

      {/* Year Label */}
      <div className="w-20 text-center font-medium">
        {selectedYear}
      </div>
    </div>
  );
}

import React from 'react';
import { 
  analyzeDataForMap, 
  selectColorPalette, 
  generateLegendSteps,
} from './legendUtils';
import type { LegendConfig } from './legendUtils';
import type { ProjectionType } from './types';

interface LegendProps {
  data: (number | string)[];
  globalExtent: [number, number];
  currentProjection?: ProjectionType;
  onProjectionChange?: (projection: ProjectionType) => void;
  geography?: boolean;
  title?: string;
}

export function Legend({ 
  data, 
  geography = true, 
  title = 'Legend' 
}: LegendProps) {
  // Analyze the data to determine legend configuration
  const config: LegendConfig = analyzeDataForMap(data, geography);
  
  // Select appropriate color palette
  const colors = selectColorPalette(config);
  
  // Generate legend steps
  const steps = generateLegendSteps(config);

  return (
    <div className="space-y-2">
      {config.categories ? (
        // Categorical legend
        <>
          {config.categories.map((category, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm">{category}</span>
            </div>
          ))}
        </>
      ) : (
        // Numerical legend
        <>
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4" 
                style={{ backgroundColor: colors[index] }}
              />
              <span className="text-sm">
                {config.scaleType === 'log' 
                  ? step.toExponential(2) 
                  : step.toFixed(2)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

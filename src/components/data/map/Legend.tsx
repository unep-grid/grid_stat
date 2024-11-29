import React from 'react';
import type { ScaleLinear, ScaleLogarithmic } from 'd3';
import { useTheme } from '../../layout/ThemeProvider';
import { t, type Language, DEFAULT_LANGUAGE } from '../../../lib/utils/translations';

interface LegendProps {
  globalExtent: [number, number];
  colorScale: (value: number) => string;
  steps?: number;
  title?: string;
  language?: Language;
  currentYear: number;
}

export function Legend({ 
  globalExtent, 
  colorScale, 
  steps = 5,
  title = 'Legend',
  language = DEFAULT_LANGUAGE,
  currentYear
}: LegendProps) {
  const { colors } = useTheme();

  // Generate legend steps based on global extent
  const legendSteps = Array.from({ length: steps }, (_, i) => 
    globalExtent[0] + (globalExtent[1] - globalExtent[0]) * (i / (steps - 1))
  );

  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-md p-2 space-y-2 shadow-md">
      <div className="text-sm font-semibold mb-1">{title}</div>
      
      {/* Color gradient legend */}
      <div className="flex items-center space-x-2">
        {legendSteps.map((step, index) => (
          <div key={index} className="flex items-center space-x-1">
            <div 
              className="w-4 h-4" 
              style={{ backgroundColor: colorScale(step) }}
            />
            <span className="text-xs">
              {step.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Missing values legend item */}
      <div className="flex items-center space-x-2 mt-1">
        <div 
          className="w-4 h-4 bg-background" 
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath d=\'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2\' stroke=\'' + encodeURIComponent(colors.foreground) + '\' stroke-width=\'0.5\' stroke-opacity=\'0.5\' /%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat'
          }}
        />
        <span className="text-xs">{t('dv.missing_values', language)}</span>
      </div>
    </div>
  );
}

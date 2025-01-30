import React from "react";
import { useTheme } from "../../layout/ThemeProvider";
import {
  t,
  type Language,
  DEFAULT_LANGUAGE,
} from "../../../lib/utils/translations";
import * as d3 from "d3";
import { type MeasureScale } from "@/lib/utils/visualization_scales";
import { createSizeScale } from "./utils";

interface D3Scale {
  (value: number): string;
  domain(): number[];
}

interface D3QuantileScale extends D3Scale {
  quantiles(): number[];
}

type ColorScale = 
  | ((value: number) => string)
  | d3.ScaleOrdinal<number, string>
  | D3QuantileScale;

function isD3Scale(scale: ColorScale): scale is D3Scale {
  return typeof scale !== 'function' || 'domain' in scale;
}

function isQuantileScale(scale: D3Scale): scale is D3QuantileScale {
  return 'quantiles' in scale;
}

interface LegendProps {
  globalExtent: [number, number];
  colorScale: ColorScale;
  measureScale?: MeasureScale;
  steps?: number;
  title?: string;
  unit?: string;
  language?: Language;
}

// Helper function to check if data needs log scale
const needsLogScale = (extent: [number, number]): boolean => {
  return extent[1] / Math.max(extent[0], 0.1) > 1000;
};

// Helper function to format values based on measure scale
const formatValue = (value: number, measureScale?: MeasureScale, extent?: [number, number]): string => {
  if (!measureScale) return value.toFixed(2);

  // Check if we should use log scale formatting
  const useLogScale = extent && needsLogScale(extent) && 
    measureScale !== 'ordinal' && measureScale !== 'nominal';

  if (useLogScale) {
    // For log-transformed values, use scientific notation
    return d3.format(".1e")(value);
  }

  switch (measureScale) {
    case 'ratio_count':
      return d3.format(",.0f")(value); // No decimals for counts
    case 'ratio_index':
      return d3.format(".2~f")(value); // 2 decimals for indices
    case 'interval':
      return d3.format(".1f")(value); // 1 decimal for intervals
    case 'ordinal':
    case 'nominal':
      return value.toString(); // Direct values for categorical
    default:
      return d3.format(".2~s")(value); // SI notation as fallback
  }
};

export function Legend({
  globalExtent,
  colorScale,
  measureScale,
  steps = 5,
  title = "Legend",
  unit,
  language = DEFAULT_LANGUAGE,
}: LegendProps) {
  const { colors } = useTheme();

  // Generate legend steps based on scale type and transformation
  const legendSteps = React.useMemo(() => {
    if (isD3Scale(colorScale)) {
      if (measureScale === 'ordinal' || measureScale === 'nominal') {
        return Array.from(colorScale.domain());
      }
      
      if (isQuantileScale(colorScale)) {
        return colorScale.quantiles();
      }
    }

    const useLogScale = needsLogScale(globalExtent) && 
      measureScale !== 'ordinal' && measureScale !== 'nominal';

    if (useLogScale) {
      // Generate steps in log space
      const logMin = Math.log10(Math.max(globalExtent[0], 0.1));
      const logMax = Math.log10(globalExtent[1]);
      return Array.from(
        { length: steps },
        (_, i) => Math.pow(10, logMin + (logMax - logMin) * (i / (steps - 1)))
      );
    }

    // Default linear steps
    return Array.from(
      { length: steps },
      (_, i) => globalExtent[0] + (globalExtent[1] - globalExtent[0]) * (i / (steps - 1))
    );
  }, [globalExtent, colorScale, steps, measureScale]);

  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-md p-2 space-y-2 shadow-md">
      <div className="text-sm font-semibold mb-1">{title}</div>

      {/* Color legend */}
      <div className="flex flex-col space-y-2">
        {[...legendSteps].reverse().map((step: number, index: number) => {
          // Get color using the same transformation as the map
          const useLogScale = needsLogScale(globalExtent) && 
            measureScale !== 'ordinal' && measureScale !== 'nominal';
          
          let color: string;
          if (useLogScale && !isD3Scale(colorScale)) {
            // Apply same log transformation as in utils.ts createColorScale
            const logMin = Math.log10(Math.max(globalExtent[0], 0.1));
            const logMax = Math.log10(globalExtent[1]);
            const normalizedValue = (Math.log10(step) - logMin) / (logMax - logMin);
            color = colorScale(normalizedValue);
          } else if (isD3Scale(colorScale)) {
            color = colorScale(step);
          } else {
            color = colorScale(step);
          }
          const label = formatValue(step, measureScale, globalExtent);
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs whitespace-nowrap">
                {label}{unit ? ` ${unit}` : ''}
              </span>
            </div>
          );
        })}

        {/* Missing values legend item */}
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 bg-background"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath d='M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2' stroke='" +
                encodeURIComponent(colors.foreground) +
                "' stroke-width='0.5' stroke-opacity='0.5' /%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat",
            }}
          />
          <span className="text-xs">{t("dv.missing_values", language)}</span>
        </div>
      </div>
    </div>
  );
}

interface ProportionalSymbolLegendProps {
  globalExtent: [number, number];
  colors: { foreground: string; background: string };
  title: string;
  unit?: string;
}

// Custom Legend for proportional symbols
export const ProportionalSymbolLegend: React.FC<ProportionalSymbolLegendProps> = (props) => {
  const { globalExtent, colors, title, unit } = props;
  const [minValue, maxValue] = globalExtent;
  const format = d3.format(".2~s"); // Use d3 SI-prefix formatting with 2 significant digits

  // Calculate intermediate values
  const steps = [
    minValue,
    minValue + (maxValue - minValue) * 0.25,
    minValue + (maxValue - minValue) * 0.5,
    minValue + (maxValue - minValue) * 0.75,
    maxValue,
  ];

  // SVG dimensions and layout
  const width = 120;
  const height = 160; // Increased height to accommodate more circles
  const margin = { top: 20, right: 40, bottom: 10, left: 10 };
  const centerX = margin.left + (width - margin.left - margin.right) / 3;

  // Use shared size scale
  const sizeScale = createSizeScale(globalExtent);

  // Calculate vertical spacing
  const verticalSpacing =
    (height - margin.top - margin.bottom) / (steps.length - 1);
 
  return (
    <div className="bg-background/80 backdrop-blur-sm rounded-md p-2 shadow-md">
      <div className="text-sm font-semibold mb-1">{title}</div>
      <svg width={width} height={height} className="overflow-visible">
        {steps.map((value, i) => {
          const radius = sizeScale(value);
          const cy = margin.top + i * verticalSpacing;
          return (
            <g key={i}>
              <circle
                cx={centerX}
                cy={cy}
                r={radius}
                fill={colors.foreground}
                stroke={colors.background}
                strokeWidth={1}
              />
              <line
                x1={centerX}
                y1={cy}
                x2={centerX + radius + 5}
                y2={cy}
                stroke={colors.foreground}
                strokeWidth={1}
              />
              <text
                x={centerX + radius + 8}
                y={cy + 4}
                className="text-xs"
                fill={colors.foreground}
              >
                {format(value)}{unit ? ` ${unit}` : ''}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

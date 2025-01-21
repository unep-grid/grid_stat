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

// Helper function to format values based on measure scale
const formatValue = (value: number, measureScale?: MeasureScale): string => {
  if (!measureScale) return value.toFixed(2);

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

  // Generate legend steps based on scale type
  const legendSteps = React.useMemo(() => {
    if (isD3Scale(colorScale)) {
      if (measureScale === 'ordinal' || measureScale === 'nominal') {
        return Array.from(colorScale.domain());
      }
      
      if (isQuantileScale(colorScale)) {
        return colorScale.quantiles();
      }
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
      <div className="flex items-center space-x-2">
        {legendSteps.map((step: number, index: number) => {
          let color: string;
          if (isD3Scale(colorScale)) {
            color = colorScale(step);
          } else {
            color = colorScale(step);
          }
          const label = formatValue(step, measureScale);
          
          return (
            <div key={index} className="flex items-center space-x-1">
              <div
                className="w-4 h-4"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs">
                {label}{unit ? ` ${unit}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Missing values legend item */}
      <div className="flex items-center space-x-2 mt-1">
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
  );
}

// Custom Legend for proportional symbols
export function ProportionalSymbolLegend({
  globalExtent,
  colors,
  title,
  unit,
}: {
  globalExtent: [number, number];
  colors: { foreground: string; background: string };
  title: string;
  unit?: string;
}) {
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

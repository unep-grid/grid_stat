import React from "react";
import type { ScaleLinear, ScaleLogarithmic } from "d3";
import { useTheme } from "../../layout/ThemeProvider";
import {
  t,
  type Language,
  DEFAULT_LANGUAGE,
} from "../../../lib/utils/translations";
import * as d3 from "d3";

interface LegendProps {
  globalExtent: [number, number];
  colorScale: (value: number) => string;
  steps?: number;
  title?: string;
  language?: Language;
}

export function Legend({
  globalExtent,
  colorScale,
  steps = 5,
  title = "Legend",
  language = DEFAULT_LANGUAGE,
}: LegendProps) {
  const { colors } = useTheme();

  // Generate legend steps based on global extent
  const legendSteps = Array.from(
    { length: steps },
    (_, i) =>
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
            <span className="text-xs">{step.toFixed(2)}</span>
          </div>
        ))}
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
}: {
  globalExtent: [number, number];
  colors: { foreground: string; background: string };
  title: string;
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
                {format(value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function createSizeScale(extent: [number, number]) {
 return d3.scaleSqrt().domain(extent).range([3, 15]); // Reduced maximum size
}

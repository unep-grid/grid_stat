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
  x?: number;
  y?: number;
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

export function Legend(props: LegendProps) {
  const {
    globalExtent,
    colorScale,
    measureScale,
    steps = 5,
    title = "Legend",
    unit,
    language = DEFAULT_LANGUAGE,
    x = 0,
    y = 0
  } = props;
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

  const boxWidth = 160;
  const boxHeight = (legendSteps.length + 2) * 20 + 30; // +2 for title and missing values
  const itemHeight = 16;
  const swatchSize = 12;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Background */}
      <rect
        x="0"
        y="0"
        width={boxWidth}
        height={boxHeight}
        fill={colors.background}
        fillOpacity="0.8"
        rx="6"
        ry="6"
      />

      {/* Title */}
      <text
        x="10"
        y="20"
        fontSize="12"
        fontWeight="600"
        fill={colors.foreground}
      >
        {title}
      </text>

      {/* Color legend items */}
      {[...legendSteps].reverse().map((step: number, index: number) => {
        const useLogScale = needsLogScale(globalExtent) && 
          measureScale !== 'ordinal' && measureScale !== 'nominal';
        
        let color: string;
        if (useLogScale && !isD3Scale(colorScale)) {
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
        const yPos = 35 + (index * itemHeight);
        
        return (
          <g key={index} transform={`translate(10,${yPos})`}>
            <rect
              width={swatchSize}
              height={swatchSize}
              fill={color}
            />
            <text
              x={swatchSize + 8}
              y={swatchSize - 3}
              fontSize="11"
              fill={colors.foreground}
            >
              {label}{unit ? ` ${unit}` : ''}
            </text>
          </g>
        );
      })}

      {/* Missing values legend item */}
      <g transform={`translate(10,${35 + (legendSteps.length * itemHeight)})`}>
        <rect
          width={swatchSize}
          height={swatchSize}
          fill={`url(#hatch)`}
        />
        <text
          x={swatchSize + 8}
          y={swatchSize - 3}
          fontSize="11"
          fill={colors.foreground}
        >
          {t("dv.missing_values", language)}
        </text>
      </g>
    </g>
  );
}

interface ProportionalSymbolLegendProps {
  globalExtent: [number, number];
  colors: { foreground: string; background: string };
  title: string;
  unit?: string;
  x?: number;
  y?: number;
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
 
  const x = props.x || 0;
  const y = props.y || 0;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Background */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={colors.background}
        fillOpacity="0.8"
        rx="6"
        ry="6"
      />
      
      {/* Title */}
      <text
        x="10"
        y="15"
        fontSize="12"
        fontWeight="600"
        fill={colors.foreground}
      >
        {title}
      </text>

        {steps.map((value, i) => {
          const radius = sizeScale(value);
          const cy = margin.top + i * verticalSpacing;
          return (
            <g key={i} transform={`translate(0,${cy})`}>
              <path
                d={d3.symbol<d3.SymbolType>().type(d3.symbolCircle).size(Math.PI * radius * radius)() || ""}
                transform={`translate(${centerX},0)`}
                fill={colors.foreground}
                stroke={colors.background}
                strokeWidth={1}
              />
              <line
                x1={centerX + radius}
                y1={0}
                x2={centerX + radius + 10}
                y2={0}
                stroke={colors.foreground}
                strokeWidth={1}
              />
              <text
                x={centerX + radius + 15}
                y={0}
                fontSize="11"
                fill={colors.foreground}
                dominantBaseline="middle"
              >
                {format(value)}{unit ? ` ${unit}` : ''}
              </text>
            </g>
          );
        })}
    </g>
  );
}

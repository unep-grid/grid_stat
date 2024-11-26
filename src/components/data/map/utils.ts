import * as d3 from "d3";
import { unM49 } from "../../../lib/utils/regions";
import type { IndicatorData } from "../../../lib/types";
import type { WorldBounds } from "./types";

// Create world bounds feature
export const createWorldBounds = (): WorldBounds => ({
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-179, -89],
        [-179, 89],
        [179, 89],
        [179, -89],
        [-179, -89]
      ]
    ]
  },
  properties: {}
});

// Throttle function to limit the rate of function calls
export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Process data for visualization
export const processCountryData = (data: IndicatorData[], selectedYear: number) => {
  const dataMap = new Map();
  const yearData = data.filter((d) => d.date_start === selectedYear);
  yearData.forEach((d) => {
    const m49Code = d.m49_code.toString().padStart(3, "0");
    const region = unM49.find((r) => r.code === m49Code);
    if (region?.iso3166) {
      dataMap.set(region.iso3166, {
        value: d.value,
        name: region.name,
      });
    }
  });
  return dataMap;
};

// Calculate global extent from data
export const calculateGlobalExtent = (data: IndicatorData[]): [number, number] => {
  const allValues = data.map((d) => d.value);
  return d3.extent(allValues) as [number, number];
};

// Create color scale
export const createColorScale = (
  globalExtent: [number, number], 
  backgroundColor: string, 
  foregroundColor: string,
  data: IndicatorData[]
) => {
  if (
    globalExtent[0] === undefined ||
    globalExtent[1] === undefined ||
    data.length === 0
  ) {
    return () => backgroundColor;
  }

  const scale = d3.scaleLinear().domain(globalExtent).range([0.2, 0.8]);

  const colorInterpolator = (t: number) => {
    return d3.interpolateHsl(backgroundColor, foregroundColor)(t);
  };

  return (value: number) => colorInterpolator(scale(value));
};

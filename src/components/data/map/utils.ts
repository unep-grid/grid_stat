import * as d3 from "d3";
import { unM49 } from "../../../lib/utils/regions";
import type { IndicatorData } from "../../../lib/types";

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
export const processRegionData = (data: IndicatorData[], selectedYear: number, latest: boolean = false) => {
  const dataMap = new Map();

  if (latest) {
    const latestData = new Map();
    data.forEach((d) => {
      const existing = latestData.get(d.m49_code);
      if (!existing || d.date_start > existing.date_start) {
        latestData.set(d.m49_code, d);
      }
    });
    latestData.forEach((d) => {
      const m49Code = d.m49_code.toString().padStart(3, "0");
      const region = unM49.find((r) => r.code === m49Code);
      if (region?.iso3166) {
        dataMap.set(region.iso3166, {
          value: d.value,
          name: region.name,
        });
      }
    });
  } else {
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
  }

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
  data: IndicatorData[]
) => {
  if (
    globalExtent[0] === undefined ||
    globalExtent[1] === undefined ||
    data.length === 0
  ) {
    return () => "#f7f7f7"; // Default color for no data
  }

  const scale = d3.scaleSequential(d3.interpolateRdPu)
    .domain(globalExtent);

  return (value: number) => scale(value);
};

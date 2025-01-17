import * as d3 from "d3";
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
      const existing = latestData.get(d.geo_entity_id);
      if (!existing || d.date_start > existing.date_start) {
        latestData.set(d.geo_entity_id, d);
      }
    });
    latestData.forEach((d) => {
      // The map uses ISO3 codes as IDs
      dataMap.set(d.geo_entity, {
        value: d.value,
        name: d.geo_entity,
        unit: d.unit,
        source: d.attributes?.source_detail
      });
    });
  } else {
    const yearData = data.filter((d) => d.date_start === selectedYear);
    yearData.forEach((d) => {
      dataMap.set(d.geo_entity, {
        value: d.value,
        name: d.geo_entity,
        unit: d.unit,
        source: d.attributes?.source_detail
      });
    });
  }

  return dataMap;
};

// Calculate global extent from data
export const calculateGlobalExtent = (data: IndicatorData[]): [number, number] => {
  const allValues = data
    .filter(d => d.value !== null)
    .map(d => d.value as number);
  
  const extent = d3.extent(allValues);
  return [
    extent[0] ?? 0,
    extent[1] ?? 0
  ];
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

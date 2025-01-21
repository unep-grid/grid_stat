import * as d3 from "d3";
import {
  type MeasureScale,
  getVisualEncoding,
  getRecommendedPalettes,
} from "@/lib/utils/visualization_scales";

import geoEntities from "@/lib/utils/geo_entities.json";

import type { GeoEntity } from "@/lib/types";
import type { IndicatorData } from "@/lib/types";

// Throttle function to limit the rate of function calls
export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function (this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Create a Map of geo_entity_id to ISO3 codes
const geoEntitiesMap = new Map(
  (geoEntities as GeoEntity[])
    .filter((e) => e.iso3) // Only keep entries with ISO3 codes
    .map((e) => [e.id, e.iso3])
);

// Log the mapping for debugging
console.log(
  "Geo entities mapping loaded:",
  `${geoEntitiesMap.size} entities with ISO3 codes`
);

// Process data for visualization
export const processRegionData = (
  data: IndicatorData[],
  selectedYear: number,
  latest: boolean = false
) => {
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
      const iso3 = geoEntitiesMap.get(d.geo_entity_id);
      dataMap.set(iso3, {
        value: d.value,
        name: d.geo_entity,
        unit: d.unit,
        source: d.attributes?.source_detail,
      });
    });
  } else {
    const yearData = data.filter((d) => d.date_start === selectedYear);
    yearData.forEach((d) => {
      const iso3 = geoEntitiesMap.get(d.geo_entity_id);
      dataMap.set(iso3, {
        value: d.value,
        name: d.geo_entity,
        unit: d.unit,
        source: d.attributes?.source_detail,
      });
    });
  }

  console.log(data, dataMap);
  return dataMap;
};

// Calculate global extent from data
export const calculateGlobalExtent = (
  data: IndicatorData[]
): [number, number] => {
  const allValues = data
    .filter((d) => d.value !== null)
    .map((d) => d.value as number);

  const extent = d3.extent(allValues);
  return [extent[0] ?? 0, extent[1] ?? 0];
};

/**
 * Get D3 color interpolator based on measure scale and data characteristics
 */
const getColorInterpolator = (
  measureScale: MeasureScale,
  extent: [number, number]
): ((t: number) => string) => {
  const hasDivergingValues = extent[0] < 0 && extent[1] > 0;
  const recommendedPalettes = getRecommendedPalettes(measureScale);

  // For qualitative data, use categorical color schemes
  if (measureScale === "nominal") {
    return d3.interpolateRainbow;
  }

  // For diverging data, use diverging color schemes
  if (hasDivergingValues && recommendedPalettes.includes("diverging")) {
    return d3.interpolateRdBu;
  }

  // For sequential data, use sequential color schemes
  if (recommendedPalettes.includes("sequential")) {
    switch (measureScale) {
      case "ratio_index":
        return d3.interpolateBlues;
      case "ordinal":
        return d3.interpolateViridis;
      default:
        return d3.interpolateYlOrRd;
    }
  }

  // Default fallback
  return d3.interpolateBlues;
};

/**
 * Create color scale based on measure scale and data characteristics
 */
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

  const measureScale =
    (data[0]?.measure_scale as MeasureScale) || "ratio_index";
  const values = data.map((d) => d.value as number).filter((v) => v != null);
  const colorInterpolator = getColorInterpolator(measureScale, globalExtent);

  // For nominal data, use ordinal scale
  if (measureScale === "nominal") {
    const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
    return d3
      .scaleOrdinal<number, string>()
      .domain(uniqueValues)
      .range(d3.quantize(colorInterpolator, uniqueValues.length));
  }

  // For ordinal data with few unique values, use quantized scale
  if (measureScale === "ordinal") {
    const uniqueValues = new Set(values);
    if (uniqueValues.size <= 7) {
      return d3
        .scaleQuantize<string>()
        .domain(globalExtent)
        .range(d3.quantize(colorInterpolator, uniqueValues.size));
    }
  }

  // For continuous data, use sequential or diverging scale
  return d3.scaleSequential(colorInterpolator).domain(globalExtent);
};

/**
 * Determine if the data should use choropleth or proportional symbol visualization
 */
export const shouldUseChoropleth = (data: IndicatorData[]): boolean => {
  if (data.length === 0) return true;
  const measureScale = data[0]?.measure_scale as MeasureScale;
  return getVisualEncoding(measureScale) === "fill_color";
};

/**
 * Create a square root scale for proportional symbols
 * Uses D3's scaleSqrt for perceptually accurate symbol sizing
 */
export const createSizeScale = (extent: [number, number]) => {
  return d3.scaleSqrt().domain(extent).range([3, 15]); // Reduced maximum size for better visibility
};

import type { IndicatorData } from "@/lib/types";

interface RegionScore {
  geoEntityId: number;
  geoEntity: string;
  score: number;
  metrics: {
    completeness: number;
    recency: number;
    magnitude: number;
  };
}

/**
 * Validates that all data points belong to the same indicator
 */
function validateIndicatorConsistency(data: IndicatorData[]): void {
  const indicatorIds = new Set(data.map((d) => d.indicator_id));
  if (indicatorIds.size !== 1) {
    throw new Error("Data contains multiple indicators");
  }
}

/**
 * Groups data by geo_entity_id and calculates metrics for each region
 */
function calculateRegionMetrics(data: IndicatorData[]): Map<number, {
  geoEntity: string;
  dataPoints: number;
  latestYear: number;
  medianValue: number;
}> {
  const regionMap = new Map();

  // Group data by geo_entity_id
  data.forEach((item) => {
    if (!regionMap.has(item.geo_entity_id)) {
      regionMap.set(item.geo_entity_id, {
        geoEntity: item.geo_entity,
        values: [],
        years: new Set(),
      });
    }
    const region = regionMap.get(item.geo_entity_id);
    region.values.push(item.value);
    region.years.add(item.date_start);
  });

  // Calculate metrics for each region
  return new Map(
    Array.from(regionMap.entries()).map(([geoEntityId, region]) => {
      // Sort values for median calculation
      const sortedValues = [...region.values].sort((a, b) => a - b);
      const medianValue =
        sortedValues.length % 2 === 0
          ? (sortedValues[sortedValues.length / 2 - 1] +
              sortedValues[sortedValues.length / 2]) /
            2
          : sortedValues[Math.floor(sortedValues.length / 2)];

      return [
        geoEntityId,
        {
          geoEntity: region.geoEntity,
          dataPoints: region.values.length,
          latestYear: Math.max(...region.years),
          medianValue,
        },
      ];
    })
  );
}

/**
 * Normalizes values to a 0-1 scale
 */
function normalizeValues(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  return range === 0
    ? values.map(() => 1) // If all values are the same, return 1
    : values.map((v) => (v - min) / range);
}

/**
 * Scores regions based on completeness, recency, and magnitude
 * Returns top N regions sorted by score
 */
export function getTopRegions(
  data: IndicatorData[],
  count: number = 10
): RegionScore[] {
  // Validate data
  if (!data.length) {
    return [];
  }
  validateIndicatorConsistency(data);

  // Calculate metrics for each region
  const regionMetrics = calculateRegionMetrics(data);

  // Extract arrays for normalization
  const metrics = Array.from(regionMetrics.values());
  const dataPoints = metrics.map((m) => m.dataPoints);
  const years = metrics.map((m) => m.latestYear);
  const medianValues = metrics.map((m) => m.medianValue);

  // Normalize each metric to 0-1 scale
  const normalizedDataPoints = normalizeValues(dataPoints);
  const normalizedYears = normalizeValues(years);
  const normalizedMedians = normalizeValues(medianValues);

  // Calculate final scores
  const scores: RegionScore[] = Array.from(regionMetrics.entries()).map(
    ([geoEntityId, metrics], index) => ({
      geoEntityId,
      geoEntity: metrics.geoEntity,
      metrics: {
        completeness: normalizedDataPoints[index],
        recency: normalizedYears[index],
        magnitude: normalizedMedians[index],
      },
      score:
        (normalizedDataPoints[index] +
          normalizedYears[index] +
          normalizedMedians[index]) /
        3,
    })
  );

  // Sort by score and return top N
  return scores.sort((a, b) => b.score - a.score).slice(0, count);
}

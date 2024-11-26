import * as d3 from 'd3';

export interface LegendConfig {
  visualType: 'choropleth' | 'proportionalCircle';
  colorScheme: 'categorical' | 'sequential' | 'diverging';
  scaleType: 'linear' | 'log';
  range: [number, number];
  distribution: 'uniform' | 'logarithmic' | 'normal' | 'unknown';
  categories?: string[] | number[] | null;
  steps: number;
}

export function analyzeDataForMap(data: (number | string)[], geography?: boolean): LegendConfig {
  // Helper functions
  const isFloat = (value: number) => Number(value) === value && value % 1 !== 0;
  const hasNegative = data.some((value) => Number(value) < 0);
  
  const isUniform = (numData: number[]) => {
    const range = Math.max(...numData) - Math.min(...numData);
    const bucketed = Array.from(new Set(numData.map(v => Math.round(v / (range / 10)))));
    return bucketed.length <= 3; // Fewer buckets → more uniform
  };
  
  const isLogDistributed = (numData: number[]) => {
    const logData = numData.map((v) => Math.log(Math.abs(Number(v)) + 1));
    return Math.max(...logData) / Math.min(...logData) > 10; // Large range after log scaling
  };

  // Convert data to numbers for numeric analysis
  const numericData = data.map(v => Number(v)).filter(v => !isNaN(v));
  
  const isCategorical = data.every((value) => 
    typeof value === "string" || Number.isInteger(Number(value))
  );

  // 1. Determine Data Characteristics
  let distribution: LegendConfig['distribution'] = "unknown";
  if (!isCategorical) {
    if (isUniform(numericData)) distribution = "uniform";
    else if (isLogDistributed(numericData)) distribution = "logarithmic";
    else distribution = "normal";
  }

  const range: [number, number] = [
    Math.min(...numericData), 
    Math.max(...numericData)
  ];
  
  const uniqueCategories = isCategorical 
    ? Array.from(new Set(data.map(String))) as string[]
    : null;

  // 2. Suggest Palette
  let colorScheme: LegendConfig['colorScheme'] = "sequential";
  let scaleType: LegendConfig['scaleType'] = "linear";
  let steps = 5; // Default number of steps

  if (isCategorical) {
    colorScheme = "categorical";
    steps = uniqueCategories ? uniqueCategories.length : 5;
  } else if (hasNegative) {
    colorScheme = "diverging";
  } else if (distribution === "logarithmic") {
    colorScheme = "sequential";
    scaleType = "log";
  }

  // 3. Suggest Visual Representation
  const visualType = geography ? "choropleth" : "proportionalCircle";

  // 4. Build Config Object
  const config: LegendConfig = {
    visualType,
    colorScheme,
    scaleType,
    range,
    distribution,
    categories: uniqueCategories,
    steps
  };

  return config;
}

// Color palette selection
export function selectColorPalette(config: LegendConfig): string[] {
  switch (config.colorScheme) {
    case 'categorical':
      return Array.from(d3.schemeCategory10).slice(0, config.steps);
    case 'diverging':
      return Array.from(d3.schemeRdYlBu[config.steps] || d3.schemeRdYlBu[9]);
    case 'sequential':
    default:
      return Array.from(d3.schemeBlues[config.steps] || d3.schemeBlues[9]);
  }
}

// Generate legend steps
export function generateLegendSteps(config: LegendConfig): number[] {
  const { range, scaleType, steps } = config;
  
  if (config.categories) {
    return config.categories.map((_, i) => i);
  }

  const [min, max] = range;
  
  if (scaleType === 'log') {
    const logMin = Math.log(Math.max(min, 1));
    const logMax = Math.log(max);
    return Array.from({ length: steps }, (_, i) => {
      const t = i / (steps - 1);
      return Math.exp(logMin + t * (logMax - logMin));
    });
  }

  // Linear scale
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    return min + t * (max - min);
  });
}

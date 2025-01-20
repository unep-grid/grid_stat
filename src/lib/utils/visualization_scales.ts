/**
 * Configuration for different measurement scales and their visual representations
 */
export const measureScales = {
  nominal: {
    description: "Categorical data without a meaningful order.",
    example: "Region names, types of vegetation.",
    visualEncoding: "fill_color" as const,
    recommendedPalettes: ["qualitative"] as const
  },
  ordinal: {
    description: "Ordered data without consistent intervals.",
    example: "Education levels (e.g., Primary, Secondary, Tertiary).",
    visualEncoding: "fill_color" as const,
    recommendedPalettes: ["sequential"] as const
  },
  interval: {
    description: "Continuous data with meaningful intervals but no true zero.",
    example: "Temperature in Celsius or Fahrenheit. e.g. 0°C ≠ absence of thermal energy,",
    visualEncoding: "fill_color" as const,
    recommendedPalettes: ["sequential", "diverging"] as const
  },
  ratio_count: {
    description: "Continuous data with meaningful zero, representing absolute counts.",
    example: "Population, number of schools.",
    visualEncoding: "symbol_size" as const,
    recommendedPalettes: [] as const
  },
  ratio_index: {
    description: "Normalized or indexed ratio data.",
    example: "Population density, GDP per capita.",
    visualEncoding: "fill_color" as const,
    recommendedPalettes: ["sequential", "diverging"] as const
  }
} as const;

/**
 * Available D3 color palettes organized by type
 */
export const colorPalettes = {
  sequential: [
    "Blues",
    "Greens",
    "Oranges",
    "Purples",
    "Reds",
    "YlGn",
    "YlOrRd"
  ],
  diverging: [
    "BrBG",
    "PiYG",
    "PRGn",
    "PuOr",
    "RdBu",
    "RdGy",
    "RdYlBu",
    "Spectral"
  ],
  qualitative: [
    "Set1",
    "Set2",
    "Set3",
    "Pastel1",
    "Pastel2",
    "Dark2",
    "Paired"
  ]
} as const;

/**
 * Type for visual encoding methods
 */
export type VisualEncoding = "fill_color" | "symbol_size";

/**
 * Type for palette categories
 */
export type PaletteCategory = keyof typeof colorPalettes;

/**
 * Type for measure scale configurations
 */
export type MeasureScale = keyof typeof measureScales;

/**
 * Helper function to get the visual encoding for a measure scale
 */
export const getVisualEncoding = (scale: MeasureScale): VisualEncoding => {
  return measureScales[scale].visualEncoding;
};

/**
 * Helper function to get recommended palettes for a measure scale
 */
export const getRecommendedPalettes = (scale: MeasureScale): readonly PaletteCategory[] => {
  return measureScales[scale].recommendedPalettes;
};

/**
 * Helper function to get available palettes for a category
 */
export const getPalettes = (category: PaletteCategory): readonly string[] => {
  return colorPalettes[category];
};

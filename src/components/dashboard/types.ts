
export interface Collection {
  id: number;
  type: string;
  title: string;
  description?: string;
}

export interface Indicator {
  id: number;
  title: string;
  description: string;
  keywords: string[];
  unit: string;
  unit_multiplier: number | null;
  source: string;
  date_publication: string;
  collections: Collection[];
  language: string;
  extras?: string;
  provider?: string;
  contact?: string | null;
  link_provider?: string;
  link_data?: string;
  license?: string;
  geographic_coverage?: string | null;
  time_series?: boolean;
  date_min?: number;
  date_max?: number;
  update_frequency?: string | null;
  version?: string | null;
  dimensions?: Array<{
    id: number;
    title: string;
    value: string;
  }>;
}

// We'll keep this for now since we don't have real time series data yet
export interface EmissionsData {
  year: number;
  [country: string]: number;
}

// For the topics sidebar, we can derive topics from collections
export interface Topic {
  id: number;
  title: string;
  count: number;
  subtopics: string[];
}

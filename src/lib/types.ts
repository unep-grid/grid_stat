export interface Indicator {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  source: string;
  last_updated: string;
  collections: Array<{
    title: string;
  }>;
}

export interface IndicatorData {
  id: string;
  m49_code: number;
  date_start: number;
  value: number;
}

export interface FilterState {
  search: string;
  categories: string[];
  keywords: string[];
}
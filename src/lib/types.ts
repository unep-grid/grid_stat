export interface Source {
  url: string;
  name: string;
  contact: string;
  citation: string | null;
  name_short: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
}

export interface Indicator {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  topics: string[];
  collections: Collection[];
  sources: Source[];
  type: string;
  source_url: string;
  language: string;
}

export interface IndicatorData {
  pid: number;
  indicator_id: number;
  indicator: string;
  geo_entity_id: number;
  geo_entity: string;
  date_start: number;
  date_end: number;
  value: number | null;
  unit: string;
  dimensions: Array<{
    id: number;
    name: string | null;
    value: string;
    dimension: string;
  }>;
  attributes: {
    nature: string;
    footnotes: string;
    source_detail: string;
    observation_status: string | null;
  };
  measure_scale: string;
}

export interface FilterState {
  search: string;
  categories: string[];
  keywords: string[];
}

export interface GeoEntity {
  id: number;
  m49: number | null;
  iso2: string | null;
  iso3: string | null;
  iso3_adm: string | null;
  name: string | null;
  geographic_levels: string[];
  source: string;
  language: string;
}

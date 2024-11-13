export interface Topic {
  title: string;
  count: number;
  subtopics: string[];
}

export interface Indicator {
  id: string;
  title: string;
  period: string;
  coverage: string;
  type: string;
}

export interface EmissionsData {
  year: number;
  [country: string]: number;
}

// src/data/mockData.ts
import type { Topic, Indicator } from '../components/dashboard/types';

export const topics: Topic[] = [
  {
    title: 'Climate change',
    count: 89,
    subtopics: ['Water', 'Energy', 'Pollution', 'Land cover', 'Disaster Risk', 'Extractives']
  },
  {
    title: 'Biodiversity',
    count: 45,
    subtopics: []
  }
];

export const indicators: Indicator[] = [
  {
    id: 'total',
    title: 'KYOTOGHG emissions by sector: Total excluding LULUCF',
    period: '1992-2022',
    coverage: '193 countries',
    type: 'Global'
  },
  {
    id: 'total_2',
    title: 'KYOTOGHG emissions by sector: Total excluding LULUCF',
    period: '1992-2022',
    coverage: '193 countries',
    type: 'Global'
  },
  {
    id: 'agriculture',
    title: 'KYOTOGHG emissions by sector: Agriculture',
    period: '1992-2022',
    coverage: '193 countries',
    type: 'Global'
  },
  {
    id: 'energy',
    title: 'KYOTOGHG emissions by sector: Energy',
    period: '1992-2022',
    coverage: '193 countries',
    type: 'Global'
  },
  {
    id: 'waste',
    title: 'KYOTOGHG emissions by sector: Waste',
    period: '1992-2022',
    coverage: '193 countries',
    type: 'Global'
  }
];

export const generateTimeSeriesData = () => {
  const years = Array.from({length: 31}, (_, i) => 1992 + i);
  return years.map(year => ({
    year,
    'China': Math.floor(Math.random() * 1000000) + 800000,
    'United States': Math.floor(Math.random() * 800000) + 600000,
    'India': Math.floor(Math.random() * 600000) + 400000,
    'Russian Federation': Math.floor(Math.random() * 400000) + 300000,
    'Japan': Math.floor(Math.random() * 300000) + 200000,
  }));
};


export const latestNews =  [
  {
    title: "Global Emissions Report 2024",
    excerpt: "New data shows significant changes in global emission patterns...",
    date: "2024-03-15",
    slug: "global-emissions-2024"
  },
  {
    title: "Policy Changes Impact",
    excerpt: "Recent policy changes show promising results in emission reduction...",
    date: "2024-03-10",
    slug: "policy-changes-impact"
  },
  {
    title: "Technology Innovations",
    excerpt: "New technologies emerge in the fight against climate change...",
    date: "2024-03-05",
    slug: "technology-innovations"
  }
];


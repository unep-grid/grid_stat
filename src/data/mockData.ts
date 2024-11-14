// src/data/mockData.ts


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

export const generateTimeSeriesData = () => {
  const years = Array.from({ length: 30 }, (_, i) => 1993 + i);
  return years.map(year => ({
    year,
    'China': Math.floor(Math.random() * 1000000 + 500000),
    'United States': Math.floor(Math.random() * 800000 + 400000),
    'India': Math.floor(Math.random() * 600000 + 300000),
    'Russian Federation': Math.floor(Math.random() * 400000 + 200000),
    'Japan': Math.floor(Math.random() * 300000 + 150000)
  }));
};

const MEILISEARCH_ENDPOINT = "https://api-search.unepgrid.ch";
const MEILISEARCH_API_KEY = "c9f3e368a1341b45f12cedc428414eb0fd451cd486831780a9010cb78d6b4b15";

interface MeilisearchResponse<T> {
  hits: T[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
  facetDistribution?: Record<string, Record<string, number>>;
  facetStats?: Record<string, any>;
}

export async function searchIndicators(
  query: string,
  language: string,
  options: {
    limit?: number;
    offset?: number;
    facets?: string[];
    filter?: {
      topics?: string[];
      sources?: string[];
      keywords?: string[];
    };
  } = {}
): Promise<MeilisearchResponse<any>> {
  const { limit = 50, offset = 0, facets = [], filter } = options;

  // Build filter conditions
  const filterConditions: string[] = [];
  
  if (filter?.topics?.length) {
    filterConditions.push(`topics IN [${filter.topics.map(t => `"${t}"`).join(',')}]`);
  }
  
  if (filter?.sources?.length) {
    filterConditions.push(`sources.name IN [${filter.sources.map(s => `"${s}"`).join(',')}]`);
  }
  
  if (filter?.keywords?.length) {
    filterConditions.push(`keywords IN [${filter.keywords.map(k => `"${k}"`).join(',')}]`);
  }

  const response = await fetch(
    `${MEILISEARCH_ENDPOINT}/indexes/statistical_${language}/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILISEARCH_API_KEY}`,
      },
      body: JSON.stringify({
        q: query,
        limit,
        offset,
        facets,
        filter: filterConditions.length ? filterConditions.join(' AND ') : undefined,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Meilisearch error: ${response.statusText}`);
  }

  return response.json() as Promise<MeilisearchResponse<any>>;
}

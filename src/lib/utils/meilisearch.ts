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
  } = {}
) {
  const { limit = 20, offset = 0, facets = [] } = options;

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
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Meilisearch error: ${response.statusText}`);
  }

  return response.json() as Promise<MeilisearchResponse<any>>;
}

export async function getIndicatorData(indicatorId: number) {
  const response = await fetch(
    `https://api.unepgrid.ch:443/stats/v2/indicatorsValues?indicator_id=eq.${indicatorId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

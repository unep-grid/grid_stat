interface IndicatorMetadata {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  topics: string[];
}

interface APIError extends Error {
  status?: number;
  details?: string;
}

const API_BASE_URL = 'https://api.unepgrid.ch:443/stats/v2';
const BATCH_SIZE = 200;  // Adjust based on API limits

async function validateIndicator(indicatorId: number): Promise<IndicatorMetadata> {
  const response = await fetch(
    `${API_BASE_URL}/indicatorsMetadata?id=eq.${indicatorId}&language=eq.en`,
    {
      headers: {
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error: APIError = new Error(`Failed to validate indicator: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  const metadata = await response.json();
  
  if (!metadata || metadata.length === 0) {
    const error: APIError = new Error(`No metadata found for indicator ${indicatorId}`);
    error.details = 'METADATA_NOT_FOUND';
    throw error;
  }

  return metadata[0];
}

async function fetchBatch(indicatorId: number, offset: number): Promise<any[]> {
  const response = await fetch(
    `${API_BASE_URL}/indicatorsValues?indicator_id=eq.${indicatorId}&limit=${BATCH_SIZE}&offset=${offset}`,
    {
      headers: {
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error: APIError = new Error(`Failed to fetch indicator data: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getIndicatorData(indicatorId: number) {
  if (!indicatorId || !Number.isInteger(indicatorId) || indicatorId <= 0) {
    throw new Error('Invalid indicator ID');
  }

  // First validate the indicator exists
  await validateIndicator(indicatorId);

  const allRecords = [];
  let currentOffset = 0;
  
  while (true) {
    const batch = await fetchBatch(indicatorId, currentOffset);
    
    if (!batch.length) {
      break;
    }
    
    allRecords.push(...batch);
    currentOffset += batch.length;

    // If we got fewer records than requested, we've hit the end
    if (batch.length < BATCH_SIZE) {
      break;
    }
  }

  return allRecords;
}
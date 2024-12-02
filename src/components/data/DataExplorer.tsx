import { useState, useEffect } from "react";
import { FilterPanel } from "./FilterPanel";
import { IndicatorList } from "./IndicatorList";
import { VisualizationPanel } from "./VisualizationPanel";
import type { Indicator, IndicatorData, FilterState } from "../../lib/types";
import type { Language } from "../../lib/utils/translations";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../../lib/utils/translations";
import { t } from "../../lib/utils/translations";

const initialFilters: FilterState = {
  search: "",
  categories: [],
  keywords: [],
};

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE; 
  const storedLang = window.localStorage?.getItem('language') as Language;
  return storedLang && SUPPORTED_LANGUAGES.includes(storedLang) ? storedLang : DEFAULT_LANGUAGE;
};

// Utility function to chunk array into smaller arrays
const chunk = <T,>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
};

export function DataExplorer() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  // Initialize language from localStorage on client-side
  useEffect(() => {
    setLanguage(getInitialLanguage());
  }, []);

  // Check URL search parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    
    if (searchParam) {
      setFilters(prev => ({
        ...prev,
        search: searchParam
      }));
    }
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLanguage(event.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  // Fetch indicators
  useEffect(() => {
    async function fetchIndicators() {
      try {
        const response = await fetch(
          `https://api.unepgrid.ch/stats/v1/indicators?language=eq.${language}`
        );
        const data = await response.json();
        setIndicators(data);
      } catch (err) {
        setError(t("dv.failed_load_indicators", language));
        console.error("Error fetching indicators:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchIndicators();
  }, [language]);

  // Fetch indicator data when selection changes
  useEffect(() => {
    if (!selectedIndicator) {
      setIndicatorData([]);
      return;
    }

    const indicatorId = selectedIndicator.id;

    async function fetchIndicatorDataChunk(offset: number): Promise<IndicatorData[]> {
      const response = await fetch(
        `https://api.unepgrid.ch/stats/v1/indicatorsData?id=eq.${indicatorId}&limit=200&offset=${offset}`
      );
      return response.json();
    }

    async function fetchAllIndicatorData() {
      try {
        const CHUNK_SIZE = 200;
        const PARALLEL_REQUESTS = 5; // Number of parallel requests to make
        let allData: IndicatorData[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
          // Create an array of offsets for parallel requests
          const offsets = Array.from({ length: PARALLEL_REQUESTS }, (_, i) => offset + i * CHUNK_SIZE);
          
          // Fetch multiple chunks in parallel
          const chunks = await Promise.all(
            offsets.map(currentOffset => fetchIndicatorDataChunk(currentOffset))
          );

          // Process the results
          const newData = chunks.flat();
          
          // If any chunk is empty or we got less data than expected, we've reached the end
          hasMore = chunks.every(chunk => chunk.length === CHUNK_SIZE);
          
          if (newData.length > 0) {
            allData = [...allData, ...newData];
            offset += PARALLEL_REQUESTS * CHUNK_SIZE;
          } else {
            hasMore = false;
          }
        }

        setIndicatorData(allData);
      } catch (err) {
        console.error("Error fetching indicator data:", err);
        setError("Failed to load indicator data");
      }
    }

    fetchAllIndicatorData();
  }, [selectedIndicator]);

  // Calculate remaining counts for categories and keywords
  const calculateFilteredCounts = (
    indicators: Indicator[],
    currentFilters: FilterState
  ) => {
    const categoryCount: Record<string, number> = {};
    const keywordCount: Record<string, number> = {};

    indicators.forEach((indicator) => {
      // Check if indicator matches current filters excluding the category being counted
      const matchesSearch =
        !currentFilters.search ||
        indicator.title
          .toLowerCase()
          .includes(currentFilters.search.toLowerCase()) ||
        indicator.description
          .toLowerCase()
          .includes(currentFilters.search.toLowerCase());

      const matchesKeywords =
        currentFilters.keywords.length === 0 ||
        currentFilters.keywords.some((keyword) =>
          indicator.keywords.some((k) =>
            k.toLowerCase().includes(keyword.toLowerCase())
          )
        );

      // Count categories
      indicator.collections.forEach((collection) => {
        const categoryTitle = collection.title;
        // When counting for a category, exclude it from the filter check
        const otherCategories = currentFilters.categories.filter(
          (c) => c !== categoryTitle
        );
        const matchesOtherCategories =
          otherCategories.length === 0 ||
          indicator.collections.some((col) =>
            otherCategories.includes(col.title)
          );

        if (matchesSearch && matchesKeywords && matchesOtherCategories) {
          categoryCount[categoryTitle] =
            (categoryCount[categoryTitle] || 0) + 1;
        }
      });

      // Count keywords
      if (
        matchesSearch &&
        (currentFilters.categories.length === 0 ||
          currentFilters.categories.some((category) =>
            indicator.collections.some((collection) =>
              collection.title.toLowerCase().includes(category.toLowerCase())
            )
          ))
      ) {
        indicator.keywords.forEach((keyword) => {
          // When counting for a keyword, exclude it from the filter check
          const otherKeywords = currentFilters.keywords.filter(
            (k) => k !== keyword
          );
          const matchesOtherKeywords =
            otherKeywords.length === 0 ||
            otherKeywords.some((k) =>
              indicator.keywords.some((ik) =>
                ik.toLowerCase().includes(k.toLowerCase())
              )
            );

          if (matchesOtherKeywords) {
            keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
          }
        });
      }
    });

    return { categoryCount, keywordCount };
  };

  // Filter indicators based on search and filters
  const filteredIndicators = indicators.filter((indicator) => {
    const matchesSearch =
      !filters.search ||
      indicator.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      indicator.description
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    const matchesCategories =
      filters.categories.length === 0 ||
      filters.categories.some((category) =>
        indicator.collections.some((collection) =>
          collection.title.toLowerCase().includes(category.toLowerCase())
        )
      );

    const matchesKeywords =
      filters.keywords.length === 0 ||
      filters.keywords.some((keyword) =>
        indicator.keywords.some((k) =>
          k.toLowerCase().includes(keyword.toLowerCase())
        )
      );

    return matchesSearch && matchesCategories && matchesKeywords;
  });

  // Extract unique categories and keywords from all indicators
  const categories = Array.from(
    new Set(
      indicators.flatMap((indicator) =>
        indicator.collections.map((collection) => collection.title)
      )
    )
  );

  const keywords = Array.from(
    new Set(indicators.flatMap((indicator) => indicator.keywords))
  );

  const { categoryCount, keywordCount } = calculateFilteredCounts(
    indicators,
    filters
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      <div className="w-64 flex-none overflow-y-auto border-r">
        <FilterPanel
          language={language}
          categories={categories}
          keywords={keywords}
          filters={filters}
          onFilterChange={setFilters}
          categoryCount={categoryCount}
          keywordCount={keywordCount}
        />
      </div>

      <div className="w-96 flex-none overflow-y-auto border-r">
        <IndicatorList
          language={language}
          indicators={filteredIndicators}
          selectedIndicator={selectedIndicator}
          onSelectIndicator={setSelectedIndicator}
          loading={loading}
          error={error}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <VisualizationPanel
          language={language}
          indicator={selectedIndicator}
          data={indicatorData}
        />
      </div>
    </div>
  );
}

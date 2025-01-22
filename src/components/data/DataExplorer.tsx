import { useState, useEffect } from "react";
import { FilterPanel } from "./FilterPanel";
import { IndicatorList } from "./IndicatorList";
import { VisualizationPanel } from "./VisualizationPanel";
import type { Indicator, IndicatorData, FilterState } from "@/lib/types";
import type { Language } from "@/lib/utils/translations";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/utils/translations";
import { t } from "@/lib/utils/translations";
import { searchIndicators } from "@/lib/utils/meilisearch";
import { getIndicatorData } from "@/lib/utils/data_fetch";

const initialFilters: FilterState = {
  search: "",
  topics: [],
  sources: [],
  keywords: [],
};

const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const storedLang = window.localStorage?.getItem("language") as Language;
  return storedLang && SUPPORTED_LANGUAGES.includes(storedLang)
    ? storedLang
    : DEFAULT_LANGUAGE;
};

export function DataExplorer() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [facets, setFacets] = useState<{
    topicCount: Record<string, number>;
    sourceCount: Record<string, number>;
    keywordCount: Record<string, number>;
  }>({
    topicCount: {},
    sourceCount: {},
    keywordCount: {},
  });

  // Store initial facet order
  const [orderedFacets, setOrderedFacets] = useState<{
    topics: string[];
    sources: string[];
    keywords: string[];
  }>({
    topics: [],
    sources: [],
    keywords: [],
  });

  // Initialize app state and perform initial search
  useEffect(() => {
    async function initialize() {
      // Get initial language and search param in one pass
      const initialLang = getInitialLanguage();
      const searchParam = new URLSearchParams(window.location.search).get("search");
      
      // Set initial state
      const initialSearchQuery = searchParam || "";
      
      try {
        setLoading(true);
        
        // Perform initial search with correct language immediately
        const result = await searchIndicators(initialSearchQuery, initialLang, {
          facets: ["topics", "sources.name", "keywords"]
        });

        // Set all state at once
        setLanguage(initialLang);
        setFilters(prev => ({
          ...prev,
          search: initialSearchQuery
        }));
        setIndicators(result.hits);
        
        if (result.facetDistribution) {
          const topics = Object.entries(result.facetDistribution["topics"] || {})
            .sort(([,a], [,b]) => b - a)
            .map(([key]) => key);
          const sources = Object.entries(result.facetDistribution["sources.name"] || {})
            .sort(([,a], [,b]) => b - a)
            .map(([key]) => key);
          const keywords = Object.entries(result.facetDistribution["keywords"] || {})
            .sort(([,a], [,b]) => b - a)
            .map(([key]) => key);

          setOrderedFacets({ topics, sources, keywords });
          setFacets({
            topicCount: result.facetDistribution["topics"] || {},
            sourceCount: result.facetDistribution["sources.name"] || {},
            keywordCount: result.facetDistribution["keywords"] || {},
          });
        }
      } catch (err) {
        console.error("Error during initialization:", err);
        setError(t("dv.failed_load_indicators", initialLang));
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    }

    initialize();

    // Set up language change listener
    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<Language>;
      const newLanguage = customEvent.detail;
      
      // Reset all state
      setLanguage(newLanguage);
      setFilters(initialFilters);
      setSelectedIndicator(null);
      setIndicatorData([]);
      setInitializing(true);
    };

    window.addEventListener("languageChange", handleLanguageChange);
    return () => {
      window.removeEventListener("languageChange", handleLanguageChange);
    };
  }, []);

  // Fetch indicator data when selection changes
  useEffect(() => {
    if (!selectedIndicator) {
      setIndicatorData([]);
      return;
    }

    async function fetchIndicatorData() {
      try {
        if (!selectedIndicator?.id) {
          console.error("No indicator ID available");
          return;
        }
        const data = await getIndicatorData(selectedIndicator.id);
        setIndicatorData(data);
      } catch (err) {
        console.error("Error fetching indicator data:", err);
        setError("Failed to load indicator data");
      }
    }

    fetchIndicatorData();
  }, [selectedIndicator]);

  // Search effect for filter changes (not initial load)
  useEffect(() => {
    // Skip if we're still initializing
    if (initializing) return;
    
    async function performSearch() {
      try {
        setLoading(true);
        
        const result = await searchIndicators(filters.search, language, {
          facets: ["topics", "sources.name", "keywords"],
          ...(filters.topics.length || filters.sources.length || filters.keywords.length ? {
            filter: {
              topics: filters.topics,
              sources: filters.sources,
              keywords: filters.keywords,
            }
          } : {})
        });

        setIndicators(result.hits);
        
        if (result.facetDistribution) {
          setFacets({
            topicCount: result.facetDistribution["topics"] || {},
            sourceCount: result.facetDistribution["sources.name"] || {},
            keywordCount: result.facetDistribution["keywords"] || {},
          });
        }

        // Clear selected indicator if it's not in the search results
        if (selectedIndicator && !result.hits.some(hit => hit.id === selectedIndicator.id)) {
          setSelectedIndicator(null);
        }
      } catch (err) {
        console.error("Error performing search:", err);
        setError(t("dv.failed_load_indicators", language));
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [language, filters.search, filters.topics, filters.sources, filters.keywords]);

  // Show loading state during initialization or search
  const isLoading = initializing || loading;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      <div className="w-80 flex-none border-r overflow-hidden">
        <FilterPanel
          language={language}
          topics={orderedFacets.topics}
          sources={orderedFacets.sources}
          keywords={orderedFacets.keywords}
          filters={filters}
          onFilterChange={setFilters}
          topicCount={facets.topicCount}
          sourceCount={facets.sourceCount}
          keywordCount={facets.keywordCount}
        />
      </div>

      <div className="w-[28rem] flex-none overflow-y-auto border-r">
        <IndicatorList
          language={language}
          indicators={indicators}
          selectedIndicator={selectedIndicator}
          onSelectIndicator={setSelectedIndicator}
          loading={isLoading}
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

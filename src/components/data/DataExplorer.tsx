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
  categories: [],
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [facets, setFacets] = useState<{
    categoryCount: Record<string, number>;
    keywordCount: Record<string, number>;
  }>({
    categoryCount: {},
    keywordCount: {},
  });

  // Initialize language from localStorage on client-side
  useEffect(() => {
    setLanguage(getInitialLanguage());
  }, []);

  // Check URL search parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");

    if (searchParam) {
      setFilters((prev) => ({
        ...prev,
        search: searchParam,
      }));
    }
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent<Language>) => {
      setLanguage(event.detail);
    };

    window.addEventListener("languageChange", handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener(
        "languageChange",
        handleLanguageChange as EventListener
      );
    };
  }, []);

  // Search indicators using Meilisearch
  useEffect(() => {
    async function searchAndUpdateIndicators() {
      try {
        setLoading(true);
        const result = await searchIndicators(filters.search, language, {
          facets: ["collections.name", "keywords"],
        });

        setIndicators(result.hits);

        // Update facets from Meilisearch response
        const categoryCount: Record<string, number> = {};
        const keywordCount: Record<string, number> = {};

        if (result.facetDistribution) {
          if (result.facetDistribution["collections.name"]) {
            Object.entries(result.facetDistribution["collections.name"]).forEach(
              ([key, value]) => {
                categoryCount[key] = value;
              }
            );
          }
          if (result.facetDistribution["keywords"]) {
            Object.entries(result.facetDistribution["keywords"]).forEach(
              ([key, value]) => {
                keywordCount[key] = value;
              }
            );
          }
        }

        setFacets({ categoryCount, keywordCount });
      } catch (err) {
        setError(t("dv.failed_load_indicators", language));
        console.error("Error searching indicators:", err);
      } finally {
        setLoading(false);
      }
    }

    searchAndUpdateIndicators();
  }, [language, filters.search]);

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

  // Extract unique categories and keywords from all indicators
  const categories = Array.from(
    new Set(
      indicators.flatMap((indicator) =>
        indicator.collections.map((collection) => collection.name)
      )
    )
  );

  const keywords = Array.from(
    new Set(indicators.flatMap((indicator) => indicator.keywords))
  );

  // Filter indicators based on category and keyword filters
  const filteredIndicators = indicators.filter((indicator) => {
    const matchesCategories =
      filters.categories.length === 0 ||
      filters.categories.some((category) =>
        indicator.collections.some((collection) =>
          collection.name.toLowerCase().includes(category.toLowerCase())
        )
      );

    const matchesKeywords =
      filters.keywords.length === 0 ||
      filters.keywords.some((keyword) =>
        indicator.keywords.some((k) =>
          k.toLowerCase().includes(keyword.toLowerCase())
        )
      );

    return matchesCategories && matchesKeywords;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      <div className="w-64 flex-none overflow-y-auto border-r">
        <FilterPanel
          language={language}
          categories={categories}
          keywords={keywords}
          filters={filters}
          onFilterChange={setFilters}
          categoryCount={facets.categoryCount}
          keywordCount={facets.keywordCount}
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

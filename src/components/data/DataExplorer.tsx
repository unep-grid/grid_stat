import { useState, useEffect } from 'react';
import { FilterPanel } from './FilterPanel';
import { IndicatorList } from './IndicatorList';
import { VisualizationPanel } from './VisualizationPanel';
import type { Indicator, IndicatorData, FilterState } from '@/lib/types';

const initialFilters: FilterState = {
  search: '',
  categories: [],
  keywords: [],
};

export function DataExplorer() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  // Fetch indicators
  useEffect(() => {
    async function fetchIndicators() {
      try {
        const response = await fetch('https://api.unepgrid.ch/stats/v1/indicators?language=eq.en');
        const data = await response.json();
        setIndicators(data);
      } catch (err) {
        setError('Failed to load indicators');
        console.error('Error fetching indicators:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchIndicators();
  }, []);

  // Fetch indicator data when selection changes
  useEffect(() => {
    if (!selectedIndicator) return;

    async function fetchIndicatorData() {
      try {
        const response = await fetch(
          `https://api.unepgrid.ch/stats/v1/indicatorsData?id=eq.${selectedIndicator.id}`
        );
        const data = await response.json();
        setIndicatorData(data);
      } catch (err) {
        console.error('Error fetching indicator data:', err);
      }
    }

    fetchIndicatorData();
  }, [selectedIndicator]);

  // Filter indicators based on search and filters
  const filteredIndicators = indicators.filter((indicator) => {
    const matchesSearch =
      !filters.search ||
      indicator.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      indicator.description.toLowerCase().includes(filters.search.toLowerCase());

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
        indicator.keywords.some((k) => k.toLowerCase().includes(keyword.toLowerCase()))
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

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-64 flex-none">
        <FilterPanel
          categories={categories}
          keywords={keywords}
          filters={filters}
          onFilterChange={setFilters}
        />
      </div>

      <div className="w-96 flex-none border-r">
        <IndicatorList
          indicators={filteredIndicators}
          selectedIndicator={selectedIndicator}
          onSelectIndicator={setSelectedIndicator}
          loading={loading}
          error={error}
        />
      </div>

      <div className="flex-1">
        <VisualizationPanel indicator={selectedIndicator} data={indicatorData} />
      </div>
    </div>
  );
}
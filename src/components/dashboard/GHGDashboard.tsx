// src/components/dashboard/GHGDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import TopicsSidebar from './TopicsSidebar';
import IndicatorsList from './IndicatorsList';
import DataVisualization from './DataVisualization';
import type { Topic, Indicator } from './types';

const GHGDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [indicatorData, setIndicatorData] = useState<any[]>([]);  // Store chart-ready data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch indicators on initial load
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await fetch('https://api.unepgrid.ch/stats/v1/indicators?language=eq.en');
        const data = await response.json();
        setIndicators(data);
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    };
    fetchIndicators();
  }, []);

  // Fetch data when an indicator is selected
  useEffect(() => {
    if (!selectedIndicator) return;

    const fetchIndicatorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://api.unepgrid.ch/stats/v1/indicatorsData?id=eq.${selectedIndicator.id}`);
        const data = await response.json();

        // Transform data for chart
        const transformedData = transformDataForChart(data);
        setIndicatorData(transformedData);
      } catch (error) {
        setError('Failed to load data.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicatorData();
  }, [selectedIndicator]);

  // Transform data into chart-compatible format
  const transformDataForChart = (data: any[]) => {
    const chartData: { [year: number]: { [country: string]: number } } = {};

    data.forEach(entry => {
      const year = entry.date_start || entry.date_end;
      const countryCode = entry.m49_code.toString();  // Use m49_code as country key
      if (!chartData[year]) chartData[year] = { year };
      chartData[year][countryCode] = entry.value;
    });

    return Object.values(chartData);  // Convert to array for Recharts
  };

  const topics = useMemo(() => {
    const collectionsMap = new Map<number, Topic>();

    indicators.forEach(indicator => {
      indicator.collections.forEach(collection => {
        if (!collectionsMap.has(collection.id)) {
          collectionsMap.set(collection.id, {
            id: collection.id,
            title: collection.title,
            count: 1,
            subtopics: []
          });
        } else {
          const topic = collectionsMap.get(collection.id);
          if (topic) {
            topic.count += 1;
          }
        }
      });
    });

    return Array.from(collectionsMap.values());
  }, [indicators]);

  const filteredIndicators = useMemo(() => {
    return indicators.filter(indicator => {
      const matchesSearch = searchTerm === '' ||
        indicator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesTopic = !selectedTopic ||
        indicator.collections.some(collection =>
          collection.id === selectedTopic.id
        );

      const matchesKeywords = selectedKeywords.length === 0 ||
        selectedKeywords.every(keyword =>
          indicator.keywords.includes(keyword)
        );

      return matchesSearch && matchesTopic && matchesKeywords;
    });
  }, [indicators, searchTerm, selectedTopic, selectedKeywords]);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className="w-[300px] border-r border-gray-200">
        <TopicsSidebar
          topics={topics}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          indicators={indicators}
          selectedKeywords={selectedKeywords}
          setSelectedKeywords={setSelectedKeywords}
        />
      </div>

      <div className="w-[400px] border-r border-gray-200 overflow-hidden">
        <IndicatorsList
          indicators={filteredIndicators}
          selectedIndicator={selectedIndicator}
          setSelectedIndicator={setSelectedIndicator}
          selectedKeywords={selectedKeywords}
        />
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <DataVisualization
          data={indicatorData}
          loading={loading}
          error={error}
          selectedIndicator={selectedIndicator}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
  );
};

export default GHGDashboard;

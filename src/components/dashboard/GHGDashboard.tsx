import React, { useState, useEffect, useMemo } from 'react';
import TopicsSidebar from './TopicsSidebar';
import IndicatorsList from './IndicatorsList';
import DataVisualization from './DataVisualization';
import { generateTimeSeriesData } from '../../data/mockData'; // Only keeping this until we have real time series data
import type { Topic, Indicator } from './types';

const GHGDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [indicators, setIndicators] = useState<Indicator[]>([]);

  // Fetch indicators from the API
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

  // Derive topics from collections in indicators
  const topics = useMemo(() => {
    const collectionsMap = new Map<number, Topic>();
    
    indicators.forEach(indicator => {
      indicator.collections.forEach(collection => {
        if (!collectionsMap.has(collection.id)) {
          collectionsMap.set(collection.id, {
            id: collection.id,
            title: collection.title,
            count: 1,
            subtopics: [] // We could potentially derive these from the data if needed
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

  // Filter indicators based on search term, selected topic, and keywords
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

  // Calculate dynamic facet counts
  const dynamicFacets = useMemo(() => {
    // Get counts excluding the selected topic filter
    const topicResults = indicators.filter(indicator => {
      const matchesSearch = searchTerm === '' || 
        indicator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesKeywords = selectedKeywords.length === 0 ||
        selectedKeywords.every(keyword => 
          indicator.keywords.includes(keyword)
        );
      
      return matchesSearch && matchesKeywords;
    });

    // Calculate topic counts
    const topicCounts = new Map<number, number>();
    topicResults.forEach(indicator => {
      indicator.collections.forEach(collection => {
        topicCounts.set(
          collection.id, 
          (topicCounts.get(collection.id) || 0) + 1
        );
      });
    });

    // Get counts excluding the selected keywords filter
    const keywordResults = indicators.filter(indicator => {
      const matchesSearch = searchTerm === '' || 
        indicator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        indicator.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTopic = !selectedTopic || 
        indicator.collections.some(collection => 
          collection.id === selectedTopic.id
        );
      
      return matchesSearch && matchesTopic;
    });

    // Calculate keyword counts
    const keywordCounts = new Map<string, number>();
    keywordResults.forEach(indicator => {
      indicator.keywords.forEach(keyword => {
        keywordCounts.set(
          keyword, 
          (keywordCounts.get(keyword) || 0) + 1
        );
      });
    });

    return {
      topicCounts,
      keywordCounts
    };
  }, [indicators, searchTerm, selectedTopic, selectedKeywords]);

  // Keep using mock time series data for now
  const timeSeriesData = generateTimeSeriesData();

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
          dynamicCounts={dynamicFacets}
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
          data={timeSeriesData}
          selectedIndicator={selectedIndicator}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
  );
};

export default GHGDashboard;

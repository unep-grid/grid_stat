import React, { useState, useEffect } from 'react';
import TopicsSidebar from './TopicsSidebar';
import IndicatorsList from './IndicatorsList';
import DataVisualization from './DataVisualization';
import { generateTimeSeriesData } from '../../data/mockData'; // Keep for now until we have real time series
import type { Topic, Indicator } from './types';

const GHGDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // Fetch indicators from the API
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await fetch('https://api.unepgrid.ch/stats/v1/indicators?language=eq.en');
        const data = await response.json();
        setIndicators(data);
        
        // Process collections into topics
        const collectionsMap = new Map<number, Topic>();
        
        data.forEach((indicator: Indicator) => {
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
        
        setTopics(Array.from(collectionsMap.values()));
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    };
    
    fetchIndicators();
  }, []);
  
  // Filter indicators based on search term, selected topic, and keywords
  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTopic = !selectedTopic || 
                        indicator.collections.some(collection => collection.id === selectedTopic.id);
    
    const matchesKeywords = selectedKeywords.length === 0 ||
                           selectedKeywords.every(keyword => 
                             indicator.keywords.includes(keyword)
                           );
    
    return matchesSearch && matchesTopic && matchesKeywords;
  });

  // Keep using mock time series data for now
  const timeSeriesData = generateTimeSeriesData();

  return (
    <div className="flex h-screen bg-white">
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

      <div className="w-[400px] border-r border-gray-200 flex flex-col h-screen overflow-hidden">
        <IndicatorsList
          indicators={filteredIndicators}
          selectedIndicator={selectedIndicator}
          setSelectedIndicator={setSelectedIndicator}
          selectedKeywords={selectedKeywords}
        />
      </div>

      <div className="flex-1 p-6">
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

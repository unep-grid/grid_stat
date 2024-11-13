import React, { useState } from 'react';
import TopicsSidebar from './TopicsSidebar';
import IndicatorsList from './IndicatorsList';
import DataVisualization from './DataVisualization';
import { topics, indicators, generateTimeSeriesData } from '../../data/mockData';
import type { Topic, Indicator } from './types';

const GHGDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  
  const data = generateTimeSeriesData();
  const filteredIndicators = indicators.filter(indicator => 
    indicator.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Left sidebar - Topics */}
      <div className="w-[300px] border-r border-gray-200">
        <TopicsSidebar
          topics={topics}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      {/* Middle section - Results */}
      <div className="w-[400px] border-r border-gray-200">
        <IndicatorsList
          indicators={filteredIndicators}
          selectedIndicator={selectedIndicator}
          setSelectedIndicator={setSelectedIndicator}
        />
      </div>

      {/* Main content - Visualization */}
      <div className="flex-1 p-6">
        <DataVisualization
          data={data}
          selectedIndicator={selectedIndicator}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>
    </div>
  );
};

export default GHGDashboard;

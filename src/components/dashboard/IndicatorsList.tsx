// src/components/dashboard/IndicatorsList.tsx
import React from 'react';
import type { Indicator } from './types';

interface IndicatorsListProps {
  indicators: Indicator[];
  selectedIndicator: Indicator | null;
  setSelectedIndicator: (indicator: Indicator | null) => void;
}

const IndicatorsList: React.FC<IndicatorsListProps> = ({
  indicators,
  selectedIndicator,
  setSelectedIndicator
}) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Results</h2>
        <div className="text-sm text-gray-500">
          {indicators.length} indicators
        </div>
      </div>
      
      {indicators.map((indicator, index) => (
        <div
          key={index}
          className={`p-4 mb-3 rounded-lg cursor-pointer transition-colors ${
            selectedIndicator?.id === indicator.id 
              ? 'bg-blue-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => setSelectedIndicator(indicator)}
        >
          <h3 className="font-medium text-lg mb-2">{indicator.title}</h3>
          <div className="flex text-sm text-gray-500 space-x-4">
            <span>{indicator.type}</span>
            <span>{indicator.period}</span>
            <span>{indicator.coverage}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IndicatorsList;

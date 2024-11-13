// src/components/dashboard/IndicatorsList.tsx
import React from 'react';
import type { Indicator } from './types';

interface IndicatorsListProps {
  indicators: Indicator[];
  selectedIndicator: Indicator | null;
  setSelectedIndicator: (indicator: Indicator | null) => void;
  selectedKeywords: string[];
}

const IndicatorsList: React.FC<IndicatorsListProps> = ({
  indicators,
  selectedIndicator,
  setSelectedIndicator,
  selectedKeywords
}) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Results</h2>
        <div className="text-sm text-gray-500">
          {indicators.length} indicators
        </div>
      </div>
      
      {indicators.map((indicator) => (
        <div
          key={indicator.id}
          className={`indicator-card ${
            selectedIndicator?.id === indicator.id 
              ? 'indicator-card-selected'
              : ''
          }`}
          onClick={() => setSelectedIndicator(indicator)}
        >
          <h3 className="font-medium text-lg mb-2">{indicator.title}</h3>
          <div className="text-sm text-gray-600 mb-2 line-clamp-2">
            {indicator.description}
          </div>
          <div 
            className="flex flex-wrap gap-2 mb-2"
            onClick={(e) => e.stopPropagation()} // Prevent click propagation to parent
          >
            {indicator.keywords.map((keyword, idx) => (
              <span 
                key={idx}
                className={`facet-badge ${
                  selectedKeywords.includes(keyword) ? 'facet-badge-selected' : ''
                }`}
              >
                {keyword}
              </span>
            ))}
          </div>
          <div className="flex text-sm text-gray-500 space-x-4">
            <span>{indicator.unit}</span>
            <span>{new Date(indicator.date_publication).getFullYear()}</span>
            {indicator.time_series && (
              <span>{indicator.date_min} - {indicator.date_max}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default IndicatorsList;

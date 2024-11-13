// src/components/dashboard/DataVisualization.tsx
import React from 'react';
import { BarChart2, Grid2X2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Indicator, EmissionsData } from './types';

interface DataVisualizationProps {
  data: EmissionsData[];
  selectedIndicator: Indicator | null;
  viewMode: 'chart' | 'table';
  setViewMode: (mode: 'chart' | 'table') => void;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  selectedIndicator,
  viewMode,
  setViewMode
}) => {
  if (!selectedIndicator) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Choose an indicator to view details
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">{selectedIndicator.title}</h2>
        <div className="flex items-center space-x-2">
          <button
            className={`p-2 rounded-lg transition-colors ${viewMode === 'chart' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setViewMode('chart')}
          >
            <BarChart2 className="h-5 w-5" />
          </button>
          <button
            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setViewMode('table')}
          >
            <Grid2X2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="year" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="China" 
                stroke="#818CF8" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="United States" 
                stroke="#34D399" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="India" 
                stroke="#FCD34D" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="Russian Federation" 
                stroke="#FB923C" 
                dot={false}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="Japan" 
                stroke="#4ADE80" 
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table implementation... */}
        </div>
      )}
    </div>
  );
};

export default DataVisualization;

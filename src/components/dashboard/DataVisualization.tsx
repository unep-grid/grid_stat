import React from 'react';
import { BarChart2, Grid2X2, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Indicator, EmissionsData } from './types';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="space-y-6">
      {/* Header with title and view toggle */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">{selectedIndicator.title}</h2>
          <p className="text-gray-600 text-sm mb-4">{selectedIndicator.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`p-2 rounded-lg transition-colors ${viewMode === 'chart' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setViewMode('chart')}
            title="Chart view"
          >
            <BarChart2 className="h-5 w-5" />
          </button>
          <button
            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => setViewMode('table')}
            title="Table view"
          >
            <Grid2X2 className="h-5 w-5" />
          </button>
          </div>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Source</h3>
          <p className="text-sm">{selectedIndicator.source}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Unit</h3>
          <p className="text-sm">{selectedIndicator.unit}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Time Range</h3>
          <p className="text-sm">
            {selectedIndicator.date_min && selectedIndicator.date_max 
              ? `${selectedIndicator.date_min} - ${selectedIndicator.date_max}`
              : 'Not specified'}
          </p>
        </div>
      </div>

      {/* Data visualization section */}
      {viewMode === 'chart' ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="year" 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  tickSize={5}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  tickSize={5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                  labelStyle={{ fontSize: '11px', fontWeight: 500 }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconSize={8}
                  iconType="plainline"
                />
                <Line 
                  type="monotone" 
                  dataKey="China" 
                  stroke="#818CF8" 
                  dot={false}
                  strokeWidth={1.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="United States" 
                  stroke="#34D399" 
                  dot={false}
                  strokeWidth={1.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="India" 
                  stroke="#FCD34D" 
                  dot={false}
                  strokeWidth={1.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="Russian Federation" 
                  stroke="#FB923C" 
                  dot={false}
                  strokeWidth={1.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="Japan" 
                  stroke="#4ADE80" 
                  dot={false}
                  strokeWidth={1.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    China
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    United States
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    India
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Russian Federation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Japan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.China.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row['United States'].toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.India.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row['Russian Federation'].toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.Japan.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional metadata and links */}
      <div className="space-y-4 mt-6">
        {selectedIndicator.extras && (
          <Alert>
            <AlertDescription>
              {selectedIndicator.extras}
            </AlertDescription>
          </Alert>
        )}
        
        {/* External links */}
        {(selectedIndicator.link_provider || selectedIndicator.link_data) && (
          <div className="flex gap-4">
            {selectedIndicator.link_provider && (
              <a 
                href={selectedIndicator.link_provider}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                Provider website
              </a>
            )}
            {selectedIndicator.link_data && (
              <a 
                href={selectedIndicator.link_data}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                Data portal
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualization;

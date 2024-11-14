import React from 'react';
import { BarChart2, Grid2X2, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataVisualizationProps {
  data: any[];
  loading: boolean;
  error: string | null;
  viewMode: 'chart' | 'table';
  selectedIndicator: any | null;
  setViewMode: (mode: 'chart' | 'table') => void;
}

const colorPalette = ["#4F46E5", "#34D399", "#FBBF24", "#F87171", "#60A5FA"];

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  loading,
  error,
  viewMode,
  selectedIndicator,
  setViewMode
}) => {
  if (!selectedIndicator) return <div>Please select an indicator to view data.</div>;

  const handleViewToggle = () => {
    setViewMode(viewMode === 'chart' ? 'table' : 'chart');
  };

  return (
    <div className="data-visualization space-y-6">
      {/* Header with title, description, and view toggle */}
      <div className="flex justify-between items-start mb-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">{selectedIndicator.title}</h2>
          <p className="text-gray-600 text-lg">{selectedIndicator.description}</p>
        </div>
        <button
          onClick={handleViewToggle}
          className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 focus:outline-none transition-all duration-200"
          aria-label="Toggle View"
        >
          {viewMode === 'chart' ? <Grid2X2 className="w-5 h-5" /> : <BarChart2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Loading, error, or data display */}
      {loading ? (
        <div>Loading data...</div>
      ) : error ? (
        <Alert type="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : viewMode === 'chart' ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fill: '#6B7280', fontSize: 14 }} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 14 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                fontSize: '14px',
                padding: '0.5rem',
              }}
              labelStyle={{ fontSize: '14px', fontWeight: 500 }}
            />
            <Legend
              wrapperStyle={{ fontSize: '14px', marginTop: 10 }}
              iconSize={10}
              iconType="circle"
            />
            {Object.keys(data[0] || {})
              .filter((key) => key !== 'year')
              .map((countryCode, index) => (
                <Line
                  key={countryCode}
                  type="monotone"
                  dataKey={countryCode}
                  stroke={colorPalette[index % colorPalette.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Year
                </th>
                {Object.keys(data[0] || {})
                  .filter((key) => key !== 'year')
                  .map((countryCode) => (
                    <th
                      key={countryCode}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      {countryCode}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.year}</td>
                  {Object.keys(row)
                    .filter((key) => key !== 'year')
                    .map((countryCode) => (
                      <td
                        key={countryCode}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                      >
                        {row[countryCode]?.toLocaleString() || '-'}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;

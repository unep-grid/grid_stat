import React, { useMemo } from 'react';
import { BarChart2, Table2, Download, Info } from 'lucide-react';
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

// Professional color palette inspired by scientific publications
const COLOR_PALETTE = [
  '#2563eb', // Primary blue
  '#16a34a', // Forest green
  '#9333ea', // Rich purple
  '#ea580c', // Burnt orange
  '#0891b2', // Teal
  '#4f46e5', // Indigo
  '#be123c', // Ruby
  '#1d4ed8', // Royal blue
];

const ViewToggle: React.FC<{
  viewMode: 'chart' | 'table';
  onToggle: () => void;
}> = ({ viewMode, onToggle }) => (
  <div className="inline-flex items-center rounded-lg bg-gray-100 p-1">
    <button
      onClick={() => viewMode === 'table' && onToggle()}
      className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
        viewMode === 'chart' 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <BarChart2 className="h-4 w-4" />
      <span>Chart</span>
    </button>
    <button
      onClick={() => viewMode === 'chart' && onToggle()}
      className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
        viewMode === 'table' 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      <Table2 className="h-4 w-4" />
      <span>Table</span>
    </button>
  </div>
);

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  loading,
  error,
  viewMode,
  selectedIndicator,
  setViewMode
}) => {
  const chartData = useMemo(() => data, [data]);

  if (!selectedIndicator) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Info className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No indicator selected</h3>
          <p className="mt-1 text-sm text-gray-500">Select an indicator from the list to view its data.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-200" />
          <div className="mt-4 h-4 w-32 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{selectedIndicator.title}</h2>
          <p className="text-sm text-gray-500">{selectedIndicator.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <ViewToggle viewMode={viewMode} onToggle={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')} />
          <button
            onClick={() => {/* Implement download logic */}}
            className="inline-flex items-center space-x-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        {viewMode === 'chart' ? (
          <ResponsiveContainer width="100%" height={480}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="year"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '0.5rem' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '2rem' }}
                iconType="circle"
                iconSize={8}
              />
              {Object.keys(chartData[0] || {})
                .filter(key => key !== 'year')
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={`Region ${key}`}
                    stroke={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Year
                  </th>
                  {Object.keys(chartData[0] || {})
                    .filter(key => key !== 'year')
                    .map(key => (
                      <th
                        key={key}
                        className="bg-gray-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Region {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {row.year}
                    </td>
                    {Object.keys(row)
                      .filter(key => key !== 'year')
                      .map(key => (
                        <td key={key} className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {row[key]?.toLocaleString() ?? '-'}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualization;

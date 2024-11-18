import { XAxis, YAxis, Line } from 'recharts';

export function ChartXAxis() {
  return (
    <XAxis
      dataKey="year"
      type="number"
      domain={['dataMin', 'dataMax']}
      tick={{ fontSize: 12 }}
      padding={{ left: 30, right: 30 }}
    />
  );
}

export function ChartYAxis() {
  return (
    <YAxis
      width={60}
      tick={{ fontSize: 12 }}
      tickFormatter={(value) => value.toLocaleString()}
    />
  );
}

interface ChartLineProps {
  dataKey: string;
  name: string;
  stroke: string;
}

export function ChartLine({ dataKey, name, stroke }: ChartLineProps) {
  return (
    <Line
      type="monotone"
      dataKey={dataKey}
      name={name}
      stroke={stroke}
      strokeWidth={2}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
    />
  );
}
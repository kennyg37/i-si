'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3, LineChart as LineChartIcon, X } from 'lucide-react';

interface DataVisualizationChartProps {
  title: string;
  data: Array<{ date: string; value: number; label?: string }>;
  unit?: string;
  dataType?: string;
  onClose?: () => void;
}

export function DataVisualizationChart({ title, data, unit = '', dataType, onClose }: DataVisualizationChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Transform data for recharts
  const chartData = data.map(d => ({
    name: d.date,
    value: d.value,
    label: d.label,
  }));

  // Get color based on data type
  const getColor = () => {
    switch (dataType) {
      case 'rainfall':
        return '#3b82f6'; // blue
      case 'temperature':
        return '#f97316'; // orange
      case 'risk':
        return '#ef4444'; // red
      default:
        return '#8b5cf6'; // purple
    }
  };

  const color = getColor();

  return (
    <Card className="w-full bg-background shadow-2xl">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="h-7 px-2"
              >
                <BarChart3 className="h-3 w-3" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="h-7 px-2"
              >
                <LineChartIcon className="h-3 w-3" />
              </Button>
            </div>

            {/* Close button */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, 'Value']}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" fill={color} name={`Value (${unit})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, 'Value']}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                name={`Value (${unit})`}
                dot={{ fill: color, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>

        {/* Data summary */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-muted rounded p-2 text-center">
            <p className="text-muted-foreground">Data Points</p>
            <p className="font-semibold">{data.length}</p>
          </div>
          <div className="bg-muted rounded p-2 text-center">
            <p className="text-muted-foreground">Average</p>
            <p className="font-semibold">
              {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)} {unit}
            </p>
          </div>
          <div className="bg-muted rounded p-2 text-center">
            <p className="text-muted-foreground">Peak</p>
            <p className="font-semibold">
              {Math.max(...data.map(d => d.value)).toFixed(2)} {unit}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

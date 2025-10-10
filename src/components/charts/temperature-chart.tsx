'use client';

import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, TrendingUp, TrendingDown } from 'lucide-react';

interface TemperatureChartProps {
  data: Array<{
    date: string;
    temperature?: number;
    tempMax?: number;
    tempMin?: number;
  }>;
  trend?: 'increasing' | 'decreasing' | 'stable';
  chartType?: 'line' | 'bar' | 'area';
}

export function TemperatureChart({ data, trend = 'stable', chartType = 'area' }: TemperatureChartProps) {
  const TrendIcon = trend === 'increasing' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'increasing' ? 'text-red-500' : trend === 'decreasing' ? 'text-blue-500' : 'text-gray-500';
  console.log(chartType)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Temperature Trend
          </CardTitle>
          {trend !== 'stable' && (
            <div className={`flex items-center gap-1 ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm font-medium capitalize">{trend}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis tick={{ fontSize: 12 }} label={{ value: '°C', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: any) => [`${value.toFixed(1)}°C`]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="tempMax"
              stroke="#f97316"
              fill="url(#tempGradient)"
              name="Max Temp"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ r: 3 }}
              name="Avg Temp"
            />
            <Line
              type="monotone"
              dataKey="tempMin"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Min Temp"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/loading-skeleton';
import { CloudRain, Thermometer, Leaf, TrendingUp } from 'lucide-react';

// Mock data for demonstration
const mockTrendData = {
  rainfall: {
    title: 'Rainfall Trends',
    icon: CloudRain,
    data: [
      { month: 'Jan', value: 120, anomaly: 15 },
      { month: 'Feb', value: 95, anomaly: -10 },
      { month: 'Mar', value: 180, anomaly: 25 },
      { month: 'Apr', value: 220, anomaly: 30 },
      { month: 'May', value: 190, anomaly: 20 },
      { month: 'Jun', value: 150, anomaly: 5 },
      { month: 'Jul', value: 80, anomaly: -20 },
      { month: 'Aug', value: 70, anomaly: -25 },
      { month: 'Sep', value: 110, anomaly: -5 },
      { month: 'Oct', value: 160, anomaly: 10 },
      { month: 'Nov', value: 200, anomaly: 35 },
      { month: 'Dec', value: 140, anomaly: 20 }
    ],
    trend: 'increasing',
    trendValue: 12.5
  },
  temperature: {
    title: 'Temperature Trends',
    icon: Thermometer,
    data: [
      { month: 'Jan', value: 22.5, anomaly: 1.2 },
      { month: 'Feb', value: 23.1, anomaly: 0.8 },
      { month: 'Mar', value: 23.8, anomaly: 1.5 },
      { month: 'Apr', value: 23.2, anomaly: 0.9 },
      { month: 'May', value: 22.9, anomaly: 0.6 },
      { month: 'Jun', value: 22.1, anomaly: -0.2 },
      { month: 'Jul', value: 21.8, anomaly: -0.5 },
      { month: 'Aug', value: 22.3, anomaly: 0.0 },
      { month: 'Sep', value: 23.5, anomaly: 1.2 },
      { month: 'Oct', value: 23.9, anomaly: 1.6 },
      { month: 'Nov', value: 23.2, anomaly: 0.9 },
      { month: 'Dec', value: 22.7, anomaly: 0.4 }
    ],
    trend: 'increasing',
    trendValue: 0.8
  },
  ndvi: {
    title: 'Vegetation Health (NDVI)',
    icon: Leaf,
    data: [
      { month: 'Jan', value: 0.65, anomaly: 0.05 },
      { month: 'Feb', value: 0.68, anomaly: 0.08 },
      { month: 'Mar', value: 0.72, anomaly: 0.12 },
      { month: 'Apr', value: 0.75, anomaly: 0.15 },
      { month: 'May', value: 0.78, anomaly: 0.18 },
      { month: 'Jun', value: 0.70, anomaly: 0.10 },
      { month: 'Jul', value: 0.62, anomaly: 0.02 },
      { month: 'Aug', value: 0.58, anomaly: -0.02 },
      { month: 'Sep', value: 0.65, anomaly: 0.05 },
      { month: 'Oct', value: 0.70, anomaly: 0.10 },
      { month: 'Nov', value: 0.68, anomaly: 0.08 },
      { month: 'Dec', value: 0.63, anomaly: 0.03 }
    ],
    trend: 'stable',
    trendValue: 0.2
  }
};

export function ClimateTrends() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(mockTrendData).map(([key, data]) => {
          const Icon = data.icon;
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold">
                    {data.trendValue > 0 ? '+' : ''}{data.trendValue}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  vs. historical average
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {Object.entries(mockTrendData).map(([key, data]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <data.icon className="h-5 w-5" />
                <span>{data.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartSkeleton />
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Trend:</span>
                  <span className={`font-medium ${
                    data.trend === 'increasing' ? 'text-green-600' : 
                    data.trend === 'decreasing' ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {data.trend}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Anomaly:</span>
                  <span className={`font-medium ${
                    data.data[data.data.length - 1].anomaly > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {data.data[data.data.length - 1].anomaly > 0 ? '+' : ''}
                    {data.data[data.data.length - 1].anomaly}
                    {key === 'temperature' ? '°C' : key === 'ndvi' ? '' : 'mm'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Positive:</strong> Vegetation health remains stable with NDVI values above historical average.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Monitor:</strong> Temperature shows a gradual increasing trend, consistent with global warming patterns.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Alert:</strong> Rainfall patterns show increased variability with more extreme precipitation events.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

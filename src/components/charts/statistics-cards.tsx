'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, CloudRain, TrendingUp, Calendar } from 'lucide-react';

interface StatisticsCardsProps {
  stats: {
    temperature: {
      average: number;
      max: number;
      min: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    precipitation: {
      total: number;
      average: number;
      max: number;
      rainyDays: number;
    };
  };
  period: number;
}

export function StatisticsCards({ stats, period }: StatisticsCardsProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            Avg Temperature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.temperature.average.toFixed(1)}°C</div>
          <p className="text-xs text-muted-foreground mt-1">
            Range: {stats.temperature.min.toFixed(1)}°C - {stats.temperature.max.toFixed(1)}°C
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CloudRain className="h-4 w-4" />
            Total Rainfall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.precipitation.total.toFixed(1)} mm</div>
          <p className="text-xs text-muted-foreground mt-1">
            Daily avg: {stats.precipitation.average.toFixed(1)} mm
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Temperature Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{stats.temperature.trend}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Over last {period} days
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Rainy Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.precipitation.rainyDays}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Max rainfall: {stats.precipitation.max.toFixed(1)} mm
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

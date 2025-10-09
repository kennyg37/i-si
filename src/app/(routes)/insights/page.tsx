'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RefreshCw, Calendar, History, TrendingUp } from 'lucide-react';
import { useHistoricalTemperature, useHistoricalPrecipitation, useClimateStatistics, useMultiLocationComparison } from '@/hooks/use-historical-climate-data';
import { TemperatureChart } from '@/components/charts/temperature-chart';
import { PrecipitationChart } from '@/components/charts/precipitation-chart';
import { ComparisonChart } from '@/components/charts/comparison-chart';
import { StatisticsCards } from '@/components/charts/statistics-cards';
import { SatelliteAnalytics } from './components/satellite-analytics';
import { ClimateIndicesDashboard } from './components/climate-indices-dashboard';
import { ExtremeWeatherEvents } from './components/extreme-weather-events';
import { HistoricalMode } from './components/historical-mode';
import { InsightsAIHelper } from '@/components/insights-ai-helper';
import toast from 'react-hot-toast';

type ViewMode = 'current' | 'historical';

export default function InsightsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('current');
  const [timeRange, setTimeRange] = useState<number>(30);

  const { data: tempData, isLoading: tempLoading, refetch: refetchTemp } = useHistoricalTemperature(timeRange);
  const { data: precipData, isLoading: precipLoading, refetch: refetchPrecip } = useHistoricalPrecipitation(timeRange);
  const { data: stats, isLoading: statsLoading } = useClimateStatistics(timeRange);
  const { data: comparisonData, isLoading: comparisonLoading } = useMultiLocationComparison();

  const handleRefresh = () => {
    refetchTemp();
    refetchPrecip();
    toast.success('Data refreshed!');
  };

  const handleExport = () => {
    const exportData = {
      period: `${timeRange} days`,
      generatedAt: new Date().toISOString(),
      statistics: stats,
      temperatureData: tempData,
      precipitationData: precipData,
      locationComparison: comparisonData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climate-insights-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  };

  const isLoading = tempLoading || precipLoading || statsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Climate Insights Dashboard</h1>
              <p className="text-muted-foreground">
                {viewMode === 'current'
                  ? 'Real-time climate data analysis and historical trends for Rwanda'
                  : 'Deep historical analysis of flood and drought patterns (3-10 years)'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={viewMode === 'current' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('current')}
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Current Insights
                </Button>
                <Button
                  variant={viewMode === 'historical' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('historical')}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  Historical Mode
                </Button>
              </div>
            </div>
          </div>

          {/* Controls - Only show for current mode */}
          {viewMode === 'current' && (
            <div className="flex items-center gap-3 mt-4 justify-end">
              <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleRefresh} variant="outline" size="icon" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </div>

        {/* Conditional Content Based on View Mode */}
        {viewMode === 'historical' ? (
          /* Historical Mode */
          <HistoricalMode lat={-1.9403} lon={29.8739} locationName="Kigali, Rwanda" />
        ) : (
          /* Current Insights Mode */
          <>
            {/* Statistics Cards */}
            {stats && !statsLoading && (
              <div className="mb-8">
                <StatisticsCards stats={stats} period={timeRange} />
              </div>
            )}

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              {/* AI Helper - Sticky Sidebar */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-4">
                  <InsightsAIHelper stats={stats} currentTimeRange={timeRange} />
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="comparison">Compare</TabsTrigger>
                <TabsTrigger value="satellite">Satellite</TabsTrigger>
                <TabsTrigger value="indices">Indices</TabsTrigger>
                <TabsTrigger value="extreme">Extreme</TabsTrigger>
              </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-64 bg-muted rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {tempData && (
                  <TemperatureChart data={tempData} trend={stats?.temperature.trend} />
                )}
                {precipData && (
                  <PrecipitationChart data={precipData} />
                )}
              </div>
            )}

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Quick Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Hottest Day</p>
                    <p className="text-2xl font-bold">{stats?.temperature.max.toFixed(1)}°C</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Coolest Day</p>
                    <p className="text-2xl font-bold">{stats?.temperature.min.toFixed(1)}°C</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Wettest Day</p>
                    <p className="text-2xl font-bold">{stats?.precipitation.max.toFixed(1)} mm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Analysis Tab */}
          <TabsContent value="detailed" className="mt-6 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Temperature Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Temperature Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Average</span>
                      <span className="font-semibold">{stats?.temperature.average.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Maximum</span>
                      <span className="font-semibold text-red-500">{stats?.temperature.max.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Minimum</span>
                      <span className="font-semibold text-blue-500">{stats?.temperature.min.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Trend</span>
                      <span className="font-semibold capitalize">{stats?.temperature.trend}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Interpretation</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats?.temperature.trend === 'increasing' &&
                        'Temperatures are rising. Monitor for heat stress and increased water needs.'}
                      {stats?.temperature.trend === 'decreasing' &&
                        'Temperatures are dropping. Watch for crop sensitivity to cooler conditions.'}
                      {stats?.temperature.trend === 'stable' &&
                        'Temperatures remain stable. Conditions are normal for this period.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Precipitation Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Precipitation Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Rainfall</span>
                      <span className="font-semibold">{stats?.precipitation.total.toFixed(1)} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Daily Average</span>
                      <span className="font-semibold">{stats?.precipitation.average.toFixed(1)} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rainy Days</span>
                      <span className="font-semibold">{stats?.precipitation.rainyDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Max Daily</span>
                      <span className="font-semibold text-blue-500">{stats?.precipitation.max.toFixed(1)} mm</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Interpretation</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats && stats.precipitation.average < 2 &&
                        'Below average rainfall. Monitor for drought conditions.'}
                      {stats && stats.precipitation.average >= 2 && stats.precipitation.average < 5 &&
                        'Normal rainfall levels. Good conditions for agriculture.'}
                      {stats && stats.precipitation.average >= 5 &&
                        'Above average rainfall. Monitor for flood risks in low-lying areas.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Combined Chart */}
            {tempData && precipData && (
              <div className="grid lg:grid-cols-1 gap-6">
                <TemperatureChart data={tempData} trend={stats?.temperature.trend} />
                <PrecipitationChart data={precipData} />
              </div>
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-6 space-y-6">
            {comparisonLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-64 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ) : comparisonData ? (
              <>
                <ComparisonChart data={comparisonData} />

                <Card>
                  <CardHeader>
                    <CardTitle>Location Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Location</th>
                            <th className="text-right p-2">Avg Temperature</th>
                            <th className="text-right p-2">Elevation</th>
                            <th className="text-right p-2">Coordinates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map((loc, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2 font-medium">{loc.location}</td>
                              <td className="text-right p-2">{loc.avgTemperature.toFixed(1)}°C</td>
                              <td className="text-right p-2">{loc.elevation.toFixed(0)}m</td>
                              <td className="text-right p-2 text-sm text-muted-foreground">
                                {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {/* Satellite Analytics Tab */}
          <TabsContent value="satellite" className="mt-6">
            <SatelliteAnalytics />
          </TabsContent>

          {/* Climate Indices Tab */}
          <TabsContent value="indices" className="mt-6">
            <ClimateIndicesDashboard />
          </TabsContent>

          {/* Extreme Weather Tab */}
          <TabsContent value="extreme" className="mt-6">
            <ExtremeWeatherEvents />
          </TabsContent>
            </Tabs>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

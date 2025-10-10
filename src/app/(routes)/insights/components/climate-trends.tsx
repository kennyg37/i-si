'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartSkeleton } from '@/components/loading-skeleton';
import { CloudRain, Thermometer, Leaf, TrendingUp, AlertCircle } from 'lucide-react';
import { useRainfallData, useTemperatureData, useDroughtRisk } from '@/lib/hooks/use-climate-data';
import { useClickedCoordinates } from '@/lib/store/map-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Time range options
const timeRangeOptions = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
  { value: '5y', label: 'Last 5 Years' }
];

// Default coordinates for Rwanda center if no location selected
const RWANDA_CENTER = { lat: -1.9403, lon: 29.8739 };

export function ClimateTrends() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1y');
  const clickedCoordinates = useClickedCoordinates();
  
  // Use clicked coordinates or default to Rwanda center
  const coordinates = clickedCoordinates || RWANDA_CENTER;
  
  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedTimeRange) {
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '5y':
        start.setFullYear(end.getFullYear() - 5);
        break;
      default:
        start.setFullYear(end.getFullYear() - 1);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [selectedTimeRange]);

  // Fetch climate data
  const { data: rainfallData, isLoading: rainfallLoading, error: rainfallError } = useRainfallData(
    coordinates.lat,
    coordinates.lon,
    startDate,
    endDate
  );

  const { data: temperatureData, isLoading: temperatureLoading, error: temperatureError } = useTemperatureData(
    coordinates.lat,
    coordinates.lon,
    startDate,
    endDate
  );

  const { data: droughtData, isLoading: droughtLoading, error: droughtError } = useDroughtRisk(
    coordinates.lat,
    coordinates.lon,
    startDate,
    endDate
  );

  // Calculate trends and anomalies from API data
  const trendData = useMemo(() => {
    const calculateTrend = (values: number[]) => {
      if (values.length < 2) return { trend: 'stable', value: 0 };
      
      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      return {
        trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
        value: Math.abs(change)
      };
    };

    const calculateAnomaly = (values: number[]) => {
      if (values.length === 0) return 0;
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const latest = values[values.length - 1];
      return latest - avg;
    };

    return {
      rainfall: {
        title: 'Rainfall Trends',
        icon: CloudRain,
        data: rainfallData?.properties?.parameter?.PRECTOT || {},
        trend: calculateTrend(Object.values(rainfallData?.properties?.parameter?.PRECTOT || {})),
        anomaly: calculateAnomaly(Object.values(rainfallData?.properties?.parameter?.PRECTOT || {})),
        loading: rainfallLoading,
        error: rainfallError
      },
      temperature: {
        title: 'Temperature Trends',
        icon: Thermometer,
        data: temperatureData?.properties?.parameter?.T2M || {},
        trend: calculateTrend(Object.values(temperatureData?.properties?.parameter?.T2M || {})),
        anomaly: calculateAnomaly(Object.values(temperatureData?.properties?.parameter?.T2M || {})),
        loading: temperatureLoading,
        error: temperatureError
      },
      drought: {
        title: 'Drought Risk',
        icon: Leaf,
        data: droughtData || {},
        trend: droughtData ? {
          trend: droughtData.riskLevel === 'high' ? 'increasing' : droughtData.riskLevel === 'low' ? 'decreasing' : 'stable',
          value: droughtData.droughtRisk * 100
        } : { trend: 'stable', value: 0 },
        anomaly: droughtData?.droughtRisk || 0,
        loading: droughtLoading,
        error: droughtError
      }
    };
  }, [rainfallData, temperatureData, droughtData, rainfallLoading, temperatureLoading, droughtLoading, rainfallError, temperatureError, droughtError]);

  const hasData = rainfallData || temperatureData || droughtData;
  const isLoading = rainfallLoading || temperatureLoading || droughtLoading;
  const hasError = rainfallError || temperatureError || droughtError;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Climate Trends Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Location</label>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm">
                  {clickedCoordinates ? (
                    <div>
                      <div className="font-medium">Selected Location</div>
                      <div className="text-muted-foreground">
                        {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Rwanda Center</div>
                      <div className="text-muted-foreground">
                        {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {!clickedCoordinates && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Click on the map to analyze climate trends for a specific location.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {hasError && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load climate data. Please check your API configuration.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !hasData && (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {hasData && (
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(trendData).map(([key, data]) => {
            const Icon = data.icon;
            const trendColor = data.trend.trend === 'increasing' ? 'text-red-600' : 
                              data.trend.trend === 'decreasing' ? 'text-green-600' : 'text-muted-foreground';
            
            return (
              <Card key={key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{data.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {data.loading ? (
                    <div className="space-y-2">
                      <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  ) : data.error ? (
                    <div className="text-sm text-destructive">Error loading data</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className={`h-4 w-4 ${trendColor}`} />
                        <span className="text-2xl font-bold">
                          {data.trend.value > 0 ? '+' : ''}{data.trend.value.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {data.trend.trend} trend
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Trend Charts */}
      {hasData && (
        <div className="grid lg:grid-cols-2 gap-6">
          {Object.entries(trendData).map(([key, data]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <data.icon className="h-5 w-5" />
                  <span>{data.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.loading ? (
                  <ChartSkeleton />
                ) : data.error ? (
                  <div className="h-64 flex items-center justify-center text-destructive">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Failed to load chart data</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ChartSkeleton />
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Trend:</span>
                        <Badge variant={data.trend.trend === 'increasing' ? 'destructive' : 
                                       data.trend.trend === 'decreasing' ? 'default' : 'secondary'}>
                          {data.trend.trend}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Latest Anomaly:</span>
                        <span className={`font-medium ${
                          data.anomaly > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {data.anomaly > 0 ? '+' : ''}
                          {data.anomaly.toFixed(2)}
                          {key === 'temperature' ? '°C' : key === 'drought' ? '' : 'mm'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Key Insights */}
      {hasData && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(trendData).map(([key, data]) => {
              if (data.loading || data.error) return null;
              
              const getInsightColor = (trend: string) => {
                switch (trend) {
                  case 'increasing':
                    return key === 'drought' ? 'red' : 'yellow';
                  case 'decreasing':
                    return key === 'drought' ? 'green' : 'yellow';
                  default:
                    return 'green';
                }
              };
              
              const getInsightMessage = (key: string, trend: string, anomaly: number) => {
                switch (key) {
                  case 'rainfall':
                    return trend === 'increasing' 
                      ? `Rainfall shows an increasing trend (+${anomaly.toFixed(1)}mm anomaly). Monitor for potential flooding.`
                      : trend === 'decreasing'
                      ? `Rainfall shows a decreasing trend (${anomaly.toFixed(1)}mm anomaly). Monitor for drought conditions.`
                      : 'Rainfall patterns are stable within normal ranges.';
                  case 'temperature':
                    return trend === 'increasing'
                      ? `Temperature shows an increasing trend (+${anomaly.toFixed(1)}°C anomaly). Consistent with warming patterns.`
                      : trend === 'decreasing'
                      ? `Temperature shows a decreasing trend (${anomaly.toFixed(1)}°C anomaly).`
                      : 'Temperature patterns are stable.';
                  case 'drought':
                    return trend === 'increasing'
                      ? `Drought risk is increasing (${(anomaly * 100).toFixed(1)}% risk). Monitor water resources.`
                      : trend === 'decreasing'
                      ? `Drought risk is decreasing (${(anomaly * 100).toFixed(1)}% risk). Conditions are improving.`
                      : 'Drought risk remains stable.';
                  default:
                    return '';
                }
              };
              
              const color = getInsightColor(data.trend.trend);
              const message = getInsightMessage(key, data.trend.trend, data.anomaly);
              
              return (
                <div key={key} className={`p-3 rounded-lg border ${
                  color === 'red' ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' :
                  color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' :
                  'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                }`}>
                  <p className={`text-sm ${
                    color === 'red' ? 'text-red-800 dark:text-red-200' :
                    color === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
                    'text-green-800 dark:text-green-200'
                  }`}>
                    <strong>{data.title}:</strong> {message}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!hasData && !isLoading && !hasError && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Climate Data Available</h3>
              <p className="text-muted-foreground">
                Climate data will appear here once you select a location on the map or configure your API endpoints.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

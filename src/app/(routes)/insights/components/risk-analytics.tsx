'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useRainfallData, useTemperatureData, useDroughtRisk, useFloodRisk } from '@/lib/hooks/use-climate-data';
import { useClickedCoordinates } from '@/lib/store/map-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Default coordinates for Rwanda center if no location selected
const RWANDA_CENTER = { lat: -1.9403, lon: 29.8739 };

// Time range options
const timeRangeOptions = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
  { value: '5y', label: 'Last 5 Years' }
];

const getRiskColor = (level: string) => {
  switch (level) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing': return <TrendingUp className="h-4 w-4 text-destructive" />;
    case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const calculateRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
};

const calculateTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  return change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable';
};

export function RiskAnalytics() {
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

  const { data: floodData, isLoading: floodLoading, error: floodError } = useFloodRisk(
    coordinates.lat,
    coordinates.lon
  );

  // Calculate risk analytics from API data
  const riskData = useMemo(() => {
    const rainfallValues = Object.values(rainfallData?.properties?.parameter?.PRECTOT || {});
    const temperatureValues = Object.values(temperatureData?.properties?.parameter?.T2M || {});
    
    // Calculate precipitation risk (based on variability and extremes)
    const precipitationRisk = rainfallValues.length > 0 ? (() => {
      const avg = rainfallValues.reduce((sum, val) => sum + val, 0) / rainfallValues.length;
      const variance = rainfallValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / rainfallValues.length;
      const stdDev = Math.sqrt(variance);
      const coefficient = stdDev / avg; // Coefficient of variation
      return Math.min(1, coefficient * 2); // Normalize to 0-1
    })() : 0;

    // Calculate temperature risk (based on warming trend)
    const temperatureRisk = temperatureValues.length > 0 ? (() => {
      const avg = temperatureValues.reduce((sum, val) => sum + val, 0) / temperatureValues.length;
      const trend = calculateTrend(temperatureValues);
      const baseRisk = avg > 25 ? 0.6 : avg > 20 ? 0.4 : 0.2; // Higher risk for warmer temperatures
      return trend === 'increasing' ? Math.min(1, baseRisk + 0.3) : baseRisk;
    })() : 0;

    // Use API data for drought and flood risk
    const droughtRisk = droughtData?.droughtRisk || 0;
    const floodRisk = floodData?.floodRisk?.score || 0;

    // Calculate vegetation risk (inverse of health)
    const vegetationRisk = 1 - (droughtData?.droughtRisk || 0.5); // Inverse relationship

    // Calculate overall risk (weighted average)
    const overallRisk = (precipitationRisk * 0.3 + temperatureRisk * 0.2 + droughtRisk * 0.2 + floodRisk * 0.2 + vegetationRisk * 0.1);

    return {
      overall: {
        score: overallRisk,
        level: calculateRiskLevel(overallRisk),
        trend: calculateTrend([precipitationRisk, temperatureRisk, droughtRisk, floodRisk, vegetationRisk]),
        change: 0.05 // Placeholder - would need historical comparison
      },
      components: {
        precipitation: {
          score: precipitationRisk,
          level: calculateRiskLevel(precipitationRisk),
          trend: calculateTrend(rainfallValues),
          description: precipitationRisk > 0.7 ? 'High precipitation variability detected' :
                      precipitationRisk > 0.4 ? 'Moderate precipitation variability' :
                      'Stable precipitation patterns'
        },
        temperature: {
          score: temperatureRisk,
          level: calculateRiskLevel(temperatureRisk),
          trend: calculateTrend(temperatureValues),
          description: temperatureRisk > 0.7 ? 'Significant warming trend observed' :
                      temperatureRisk > 0.4 ? 'Moderate temperature increase' :
                      'Stable temperature patterns'
        },
        vegetation: {
          score: vegetationRisk,
          level: calculateRiskLevel(vegetationRisk),
          trend: droughtData?.riskLevel === 'high' ? 'increasing' : droughtData?.riskLevel === 'low' ? 'decreasing' : 'stable',
          description: vegetationRisk > 0.7 ? 'Vegetation stress detected' :
                      vegetationRisk > 0.4 ? 'Moderate vegetation health concerns' :
                      'Vegetation health is stable'
        },
        flood: {
          score: floodRisk,
          level: floodData?.floodRisk?.level || 'low',
          trend: 'stable', // Would need historical data
          description: floodRisk > 0.7 ? 'High flood risk due to elevation and precipitation' :
                      floodRisk > 0.4 ? 'Moderate flood risk' :
                      'Low flood risk'
        },
        drought: {
          score: droughtRisk,
          level: droughtData?.riskLevel || 'low',
          trend: droughtData?.riskLevel === 'high' ? 'increasing' : droughtData?.riskLevel === 'low' ? 'decreasing' : 'stable',
          description: droughtRisk > 0.7 ? 'High drought risk detected' :
                      droughtRisk > 0.4 ? 'Moderate drought risk' :
                      'Low drought risk'
        }
      },
      timeSeries: [], // Would need historical data for time series
      predictions: {
        nextMonth: overallRisk * 1.1, // Placeholder - would need ML model
        nextQuarter: overallRisk * 1.05,
        nextYear: overallRisk * 1.2
      }
    };
  }, [rainfallData, temperatureData, droughtData, floodData]);

  const hasData = rainfallData || temperatureData || droughtData || floodData;
  const isLoading = rainfallLoading || temperatureLoading || droughtLoading || floodLoading;
  const hasError = rainfallError || temperatureError || droughtError || floodError;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analytics</CardTitle>
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
                <strong>Tip:</strong> Click on the map to analyze risk for a specific location.
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
              <span>Failed to load risk data. Please check your API configuration.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !hasData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-16 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-2 w-full bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Overall Risk Score */}
      {hasData && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Overall Climate Risk Index</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                  {(riskData.overall.score * 100).toFixed(1)}%
                </div>
                <Badge variant={getRiskColor(riskData.overall.level) as "default" | "destructive" | "secondary" | "outline"}>
                  {riskData.overall.level.toUpperCase()} RISK
                </Badge>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center space-x-1">
                  {getTrendIcon(riskData.overall.trend)}
                <span className="text-sm text-muted-foreground">
                    {riskData.overall.trend}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                  Based on {selectedTimeRange} data
                </div>
              </div>
            </div>
            <Progress value={riskData.overall.score * 100} className="h-3" />
        </CardContent>
      </Card>
      )}

      {/* Risk Components */}
      {hasData && (
      <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(riskData.components).map(([key, component]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{key}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={getRiskColor(component.level) as "default" | "destructive" | "secondary" | "outline"}>
                  {component.level}
                </Badge>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(component.trend)}
                  <span className="text-sm text-muted-foreground">
                    {component.trend}
                  </span>
                </div>
              </div>
              <Progress value={component.score * 100} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {component.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Risk Predictions */}
      {hasData && (
      <Card>
        <CardHeader>
          <CardTitle>Risk Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                  {(riskData.predictions.nextMonth * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Next Month</div>
                <Badge variant={riskData.predictions.nextMonth > 0.7 ? 'destructive' : 'default'}>
                  {riskData.predictions.nextMonth > 0.7 ? 'High' : 'Medium'}
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                  {(riskData.predictions.nextQuarter * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Next Quarter</div>
                <Badge variant={riskData.predictions.nextQuarter > 0.7 ? 'destructive' : 'default'}>
                  {riskData.predictions.nextQuarter > 0.7 ? 'High' : 'Medium'}
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                  {(riskData.predictions.nextYear * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Next Year</div>
                <Badge variant={riskData.predictions.nextYear > 0.7 ? 'destructive' : 'default'}>
                  {riskData.predictions.nextYear > 0.7 ? 'High' : 'Medium'}
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Predictions are based on current trends and should be used as guidance only. 
                Actual risk may vary based on weather patterns and other factors.
              </p>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Dynamic Recommendations */}
      {hasData && (
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            {riskData.overall.level === 'high' && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Immediate Action Required:</strong> High overall risk detected. 
                  Monitor all risk factors closely and implement emergency preparedness measures.
                </p>
              </div>
            )}
            
            {riskData.components.flood.score > 0.7 && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Flood Risk Alert:</strong> High flood risk detected. 
                  Monitor water levels and prepare evacuation plans if necessary.
                </p>
              </div>
            )}
            
            {riskData.components.drought.score > 0.7 && (
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Drought Risk Alert:</strong> High drought risk detected. 
                  Monitor water resources and consider water conservation measures.
            </p>
          </div>
            )}
            
            {riskData.components.temperature.score > 0.6 && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Temperature Monitoring:</strong> Elevated temperature risk detected. 
                  Monitor heat stress and prepare for temperature-related impacts on agriculture.
            </p>
          </div>
            )}
            
            {riskData.overall.level === 'low' && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Stable Conditions:</strong> Overall risk levels are low. 
                  Continue regular monitoring and maintain current preparedness measures.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!hasData && !isLoading && !hasError && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Risk Data Available</h3>
              <p className="text-muted-foreground">
                Risk analytics will appear here once you select a location on the map or configure your API endpoints.
            </p>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

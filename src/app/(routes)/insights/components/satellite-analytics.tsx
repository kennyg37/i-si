'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Leaf, Thermometer, Droplets, TreePine, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNDVIData, useLandSurfaceTemperature, useSoilMoisture, useLandUse } from '@/hooks/use-satellite-data';
import { useClickedCoordinates } from '@/lib/store/map-store';

// Default coordinates for Rwanda center if no location selected
const RWANDA_CENTER = { lat: -1.9403, lon: 29.8739 };

// Time range options
const timeRangeOptions = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
  { value: '2y', label: 'Last 2 Years' }
];

const getHealthColor = (health: string) => {
  switch (health) {
    case 'excellent': return 'text-green-600';
    case 'good': return 'text-green-500';
    case 'moderate': return 'text-yellow-500';
    case 'poor': return 'text-orange-500';
    case 'critical': return 'text-red-600';
    default: return 'text-muted-foreground';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function SatelliteAnalytics() {
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
      case '2y':
        start.setFullYear(end.getFullYear() - 2);
        break;
      default:
        start.setFullYear(end.getFullYear() - 1);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [selectedTimeRange]);

  // Fetch satellite data
  const { data: ndviData, isLoading: ndviLoading, error: ndviError, vegetationHealth } = useNDVIData({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const { data: lstData, isLoading: lstLoading, error: lstError, temperatureAnalysis } = useLandSurfaceTemperature({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const { data: soilData, isLoading: soilLoading, error: soilError, moistureAnalysis } = useSoilMoisture({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const { data: landUseData, isLoading: landUseLoading, error: landUseError, landUseAnalysis } = useLandUse({
    lat: coordinates.lat,
    lon: coordinates.lon
  });

  const hasData = ndviData || lstData || soilData || landUseData;
  const isLoading = ndviLoading || lstLoading || soilLoading || landUseLoading;
  const hasError = ndviError || lstError || soilError || landUseError;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Satellite Analytics</CardTitle>
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
                <strong>Tip:</strong> Click on the map to analyze satellite data for a specific location.
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
              <span>Failed to load satellite data. Please check your API configuration.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !hasData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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

      {/* Satellite Data Summary Cards */}
      {hasData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vegetation Health (NDVI) */}
          {vegetationHealth && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vegetation Health</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(vegetationHealth.trend)}
                    <span className={`text-2xl font-bold ${getHealthColor(vegetationHealth.current?.health || 'moderate')}`}>
                      {vegetationHealth.current?.score.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {vegetationHealth.current?.health || 'Unknown'} health
                  </p>
                  <Progress value={(vegetationHealth.current?.score || 0) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Land Surface Temperature */}
          {temperatureAnalysis && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Surface Temperature</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(temperatureAnalysis.trend === 'warming' ? 'declining' : temperatureAnalysis.trend === 'cooling' ? 'improving' : 'stable')}
                    <span className="text-2xl font-bold">
                      {temperatureAnalysis.current?.average.toFixed(1) || 'N/A'}°C
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {temperatureAnalysis.heatIsland ? 'Heat island detected' : 'Normal conditions'}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Day: {temperatureAnalysis.current?.day.toFixed(1)}°C | 
                    Night: {temperatureAnalysis.current?.night.toFixed(1)}°C
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Soil Moisture */}
          {moistureAnalysis && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Soil Moisture</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(moistureAnalysis.trend === 'wetting' ? 'improving' : moistureAnalysis.trend === 'drying' ? 'declining' : 'stable')}
                    <span className="text-2xl font-bold">
                      {(moistureAnalysis.current?.rootZone || 0) * 100}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {moistureAnalysis.droughtRisk} drought risk
                  </p>
                  <Progress value={(moistureAnalysis.current?.rootZone || 0) * 100} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Irrigation need: {(moistureAnalysis.irrigationNeed * 100).toFixed(0)}%
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Land Use */}
          {landUseAnalysis && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Land Use</CardTitle>
                <TreePine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold capitalize">
                    {landUseAnalysis.dominantType}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {landUseAnalysis.agriculturalPercentage.toFixed(0)}% agricultural
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Forest: {landUseAnalysis.forestPercentage.toFixed(0)}% | 
                    Impact: {landUseAnalysis.environmentalImpact}
                  </div>
                  <Badge variant={landUseAnalysis.urbanizationTrend === 'increasing' ? 'destructive' : 'secondary'}>
                    Urbanization {landUseAnalysis.urbanizationTrend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Analysis */}
      {hasData && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Vegetation Health Analysis */}
          {vegetationHealth && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5" />
                  <span>Vegetation Health Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Current Health</span>
                    <Badge variant={vegetationHealth.current?.health === 'excellent' || vegetationHealth.current?.health === 'good' ? 'default' : 'destructive'}>
                      {vegetationHealth.current?.health || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">NDVI Score</span>
                    <span className="font-semibold">{vegetationHealth.current?.score.toFixed(3) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trend</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(vegetationHealth.trend)}
                      <span className="text-sm capitalize">{vegetationHealth.trend}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average NDVI</span>
                    <span className="font-semibold">{vegetationHealth.average.toFixed(3)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Interpretation</h4>
                  <p className="text-sm text-muted-foreground">
                    {vegetationHealth.current?.health === 'excellent' && 'Excellent vegetation health indicates optimal growing conditions and high biomass.'}
                    {vegetationHealth.current?.health === 'good' && 'Good vegetation health shows healthy plant growth with adequate resources.'}
                    {vegetationHealth.current?.health === 'moderate' && 'Moderate vegetation health suggests some stress but generally stable conditions.'}
                    {vegetationHealth.current?.health === 'poor' && 'Poor vegetation health indicates significant stress and potential degradation.'}
                    {vegetationHealth.current?.health === 'critical' && 'Critical vegetation health shows severe stress and potential ecosystem collapse.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Soil Moisture Analysis */}
          {moistureAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Droplets className="h-5 w-5" />
                  <span>Soil Moisture Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Surface Moisture</span>
                    <span className="font-semibold">{(moistureAnalysis.current?.surface || 0) * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Root Zone Moisture</span>
                    <span className="font-semibold">{(moistureAnalysis.current?.rootZone || 0) * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Drought Risk</span>
                    <Badge variant={moistureAnalysis.droughtRisk === 'low' ? 'default' : moistureAnalysis.droughtRisk === 'moderate' ? 'secondary' : 'destructive'}>
                      {moistureAnalysis.droughtRisk}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Irrigation Need</span>
                    <span className="font-semibold">{(moistureAnalysis.irrigationNeed * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {moistureAnalysis.droughtRisk === 'extreme' && (
                      <p className="text-sm text-red-600">Immediate irrigation required to prevent crop loss.</p>
                    )}
                    {moistureAnalysis.droughtRisk === 'high' && (
                      <p className="text-sm text-orange-600">Consider irrigation to maintain crop health.</p>
                    )}
                    {moistureAnalysis.droughtRisk === 'moderate' && (
                      <p className="text-sm text-yellow-600">Monitor soil moisture closely and prepare for irrigation.</p>
                    )}
                    {moistureAnalysis.droughtRisk === 'low' && (
                      <p className="text-sm text-green-600">Soil moisture levels are adequate for current conditions.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Data State */}
      {!hasData && !isLoading && !hasError && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Satellite Data Available</h3>
              <p className="text-muted-foreground">
                Satellite analytics will appear here once you select a location on the map or configure your API endpoints.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

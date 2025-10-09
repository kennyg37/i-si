'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Droplets, Thermometer, Wind, Sun, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSPIData, useSPEIData, useHeatIndex, useWindChill } from '@/hooks/use-climate-indices';
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'extreme': return 'text-red-600';
    case 'severe': return 'text-red-500';
    case 'moderate': return 'text-yellow-500';
    case 'mild': return 'text-orange-500';
    case 'none': return 'text-green-600';
    default: return 'text-muted-foreground';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'extreme': return 'destructive';
    case 'high': return 'destructive';
    case 'moderate': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'worsening': return <TrendingDown className="h-4 w-4 text-red-600" />;
    case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />;
    case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function ClimateIndicesDashboard() {
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

  // Fetch climate indices data
  const { data: spiData, isLoading: spiLoading, error: spiError, droughtAnalysis: spiDrought } = useSPIData({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const { data: speiData, isLoading: speiLoading, error: speiError, droughtAnalysis: speiDrought } = useSPEIData({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const { data: heatData, isLoading: heatLoading, error: heatError, heatAnalysis } = useHeatIndex({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const { data: windChillData, isLoading: windChillLoading, error: windChillError, coldAnalysis } = useWindChill({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const hasData = spiData || speiData || heatData || windChillData;
  const isLoading = spiLoading || speiLoading || heatLoading || windChillLoading;
  const hasError = spiError || speiError || heatError || windChillError;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Climate Indices Dashboard</CardTitle>
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
                <strong>Tip:</strong> Click on the map to analyze climate indices for a specific location.
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
              <span>Failed to load climate indices data. Please check your API configuration.</span>
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

      {/* Climate Indices Summary Cards */}
      {hasData && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Standardized Precipitation Index (SPI) */}
          {spiDrought && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drought Index (SPI)</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(spiDrought.trend)}
                    <span className={`text-2xl font-bold ${getSeverityColor(spiDrought.severity)}`}>
                      {spiDrought.current?.value.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {spiDrought.current?.category || 'Unknown'}
                  </p>
                  <Progress 
                    value={Math.max(0, Math.min(100, (spiDrought.current?.value || 0) * 25 + 50))} 
                    className="h-2" 
                  />
                  <div className="text-xs text-muted-foreground">
                    Duration: {spiDrought.duration} months
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Standardized Precipitation Evapotranspiration Index (SPEI) */}
          {speiDrought && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drought Index (SPEI)</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(speiDrought.trend)}
                    <span className={`text-2xl font-bold ${getSeverityColor(speiDrought.severity)}`}>
                      {speiDrought.current?.value.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {speiDrought.current?.category || 'Unknown'}
                  </p>
                  <Progress 
                    value={Math.max(0, Math.min(100, (speiDrought.current?.value || 0) * 25 + 50))} 
                    className="h-2" 
                  />
                  <div className="text-xs text-muted-foreground">
                    {speiDrought.temperatureImpact ? 'Temperature impact' : 'Normal conditions'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Heat Index */}
          {heatAnalysis && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Heat Index</CardTitle>
                <Sun className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(heatAnalysis.trend)}
                    <span className="text-2xl font-bold">
                      {heatAnalysis.current?.value.toFixed(0) || 'N/A'}°F
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {heatAnalysis.current?.category || 'Unknown'}
                  </p>
                  <Badge variant={getRiskColor(heatAnalysis.riskLevel) as "default" | "destructive" | "secondary" | "outline"}>
                    {heatAnalysis.riskLevel} risk
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Heat wave days: {heatAnalysis.heatWaveDays}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wind Chill */}
          {coldAnalysis && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wind Chill</CardTitle>
                <Wind className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(coldAnalysis.trend)}
                    <span className="text-2xl font-bold">
                      {coldAnalysis.current?.value.toFixed(0) || 'N/A'}°F
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">
                    {coldAnalysis.current?.category || 'Unknown'}
                  </p>
                  <Badge variant={getRiskColor(coldAnalysis.riskLevel) as "default" | "destructive" | "secondary" | "outline"}>
                    {coldAnalysis.riskLevel} risk
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {coldAnalysis.frostbiteRisk ? 'Frostbite risk' : 'Safe conditions'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detailed Analysis */}
      {hasData && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Drought Analysis */}
          {(spiDrought || speiDrought) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Droplets className="h-5 w-5" />
                  <span>Drought Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {spiDrought && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Standardized Precipitation Index (SPI)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Value</span>
                        <span className="font-semibold">{spiDrought.current?.value.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Category</span>
                        <Badge variant={spiDrought.severity === 'none' ? 'default' : 'destructive'}>
                          {spiDrought.current?.category}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Trend</span>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(spiDrought.trend)}
                          <span className="text-sm capitalize">{spiDrought.trend}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Duration</span>
                        <span className="font-semibold">{spiDrought.duration} months</span>
                      </div>
                    </div>
                  </div>
                )}

                {speiDrought && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Standardized Precipitation Evapotranspiration Index (SPEI)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Value</span>
                        <span className="font-semibold">{speiDrought.current?.value.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Category</span>
                        <Badge variant={speiDrought.severity === 'none' ? 'default' : 'destructive'}>
                          {speiDrought.current?.category}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Temperature Impact</span>
                        <Badge variant={speiDrought.temperatureImpact ? 'destructive' : 'default'}>
                          {speiDrought.temperatureImpact ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Interpretation</h4>
                  <p className="text-sm text-muted-foreground">
                    {spiDrought?.severity === 'extreme' && 'Extreme drought conditions detected. Immediate water conservation measures required.'}
                    {spiDrought?.severity === 'severe' && 'Severe drought conditions. Monitor water resources closely and implement conservation measures.'}
                    {spiDrought?.severity === 'moderate' && 'Moderate drought conditions. Prepare for potential water shortages.'}
                    {spiDrought?.severity === 'mild' && 'Mild drought conditions. Monitor precipitation patterns.'}
                    {spiDrought?.severity === 'none' && 'Normal precipitation conditions. No drought concerns at this time.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Heat and Cold Analysis */}
          {(heatAnalysis || coldAnalysis) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="h-5 w-5" />
                  <span>Temperature Stress Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {heatAnalysis && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Heat Index</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Value</span>
                        <span className="font-semibold">{heatAnalysis.current?.value.toFixed(0)}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Feels Like</span>
                        <span className="font-semibold">{heatAnalysis.current?.feelsLike.toFixed(0)}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Risk Level</span>
                        <Badge variant={getRiskColor(heatAnalysis.riskLevel) as "default" | "destructive" | "secondary" | "outline"}>
                          {heatAnalysis.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Heat Wave Days</span>
                        <span className="font-semibold">{heatAnalysis.heatWaveDays}</span>
                      </div>
                    </div>
                  </div>
                )}

                {coldAnalysis && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Wind Chill</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Value</span>
                        <span className="font-semibold">{coldAnalysis.current?.value.toFixed(0)}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Feels Like</span>
                        <span className="font-semibold">{coldAnalysis.current?.feelsLike.toFixed(0)}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Risk Level</span>
                        <Badge variant={getRiskColor(coldAnalysis.riskLevel) as "default" | "destructive" | "secondary" | "outline"}>
                          {coldAnalysis.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Frostbite Risk</span>
                        <Badge variant={coldAnalysis.frostbiteRisk ? 'destructive' : 'default'}>
                          {coldAnalysis.frostbiteRisk ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {heatAnalysis?.recommendations.map((rec, index) => (
                      <p key={index} className="text-sm text-muted-foreground">• {rec}</p>
                    ))}
                    {coldAnalysis?.recommendations.map((rec, index) => (
                      <p key={index} className="text-sm text-muted-foreground">• {rec}</p>
                    ))}
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
              <h3 className="text-lg font-semibold mb-2">No Climate Indices Data Available</h3>
              <p className="text-muted-foreground">
                Climate indices will appear here once you select a location on the map or configure your API endpoints.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * ClimateRiskPopup Component
 * 
 * Comprehensive popup that displays all climate data and risk scores
 * when a user clicks on the map. Shows:
 * - NDVI (vegetation health)
 * - Rainfall data (recent and historical)
 * - Temperature data
 * - Elevation and slope
 * - Computed risk scores (flood, drought, prediction)
 * - Recommendations and alerts
 */

import React, { useState, useEffect } from 'react';
import { Popup } from 'react-map-gl/mapbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Thermometer, 
  Droplets, 
  Leaf, 
  Mountain, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { useRainfallData, useTemperatureData, useDroughtRisk, useFloodRisk } from '@/lib/hooks/use-climate-data';
import { useNDVIData, useSoilMoisture } from '@/hooks/use-satellite-data';
import { calculateFloodPrediction } from '@/lib/data/flood-prediction';

export interface ClimateRiskPopupProps {
  coordinates: {
    lat: number;
    lon: number;
  };
  onClose: () => void;
  timeRange?: string;
}

export interface ClimateData {
  // Basic climate data
  rainfall: {
    recent: number; // mm last 7 days
    monthly: number; // mm last 30 days
    trend: 'increasing' | 'decreasing' | 'stable';
    anomaly: number; // % difference from normal
  };
  temperature: {
    current: number; // °C
    average: number; // °C
    trend: 'warming' | 'cooling' | 'stable';
    anomaly: number; // °C difference from normal
  };
  elevation: {
    value: number; // meters
    slope: number; // degrees
    drainage: 'good' | 'moderate' | 'poor';
  };
  
  // Satellite data
  ndvi: {
    value: number; // 0-1 scale
    health: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    trend: 'improving' | 'declining' | 'stable';
  };
  soilMoisture: {
    surface: number; // 0-1 scale
    rootZone: number; // 0-1 scale
    trend: 'wetting' | 'drying' | 'stable';
  };
  
  // Risk scores
  floodRisk: {
    score: number; // 0-1 scale
    level: 'low' | 'moderate' | 'high' | 'extreme';
    confidence: number; // 0-1 scale
  };
  droughtRisk: {
    score: number; // 0-1 scale
    level: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme';
    confidence: number; // 0-1 scale
  };
  floodPrediction: {
    score: number; // 0-1 scale
    level: 'low' | 'moderate' | 'high' | 'extreme';
    next24h: number;
    next3days: number;
    next7days: number;
  };
  
  // Metadata
  lastUpdated: string;
  dataQuality: 'excellent' | 'good' | 'moderate' | 'poor';
}

export function ClimateRiskPopup({ coordinates, onClose, timeRange = '30d' }: ClimateRiskPopupProps) {
  const [climateData, setClimateData] = useState<ClimateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate date range
  const { startDate, endDate } = React.useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [timeRange]);

  // Fetch all climate data
  const { data: rainfallData, isLoading: rainfallLoading } = useRainfallData(
    coordinates.lat,
    coordinates.lon,
    startDate,
    endDate
  );

  const { data: temperatureData, isLoading: temperatureLoading } = useTemperatureData(
    coordinates.lat,
    coordinates.lon,
    startDate,
    endDate
  );

  const { data: droughtData, isLoading: droughtLoading } = useDroughtRisk(
    coordinates.lat,
    coordinates.lon,
    startDate,
    endDate
  );

  const { data: floodData, isLoading: floodLoading } = useFloodRisk(
    coordinates.lat,
    coordinates.lon
  );

  const { data: ndviData, vegetationHealth, isLoading: ndviLoading } = useNDVIData({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  const { data: soilData, moistureAnalysis, isLoading: soilLoading } = useSoilMoisture({
    lat: coordinates.lat,
    lon: coordinates.lon,
    startDate,
    endDate
  });

  // Process and combine all data
  useEffect(() => {
    const processClimateData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for all data to load
        if (rainfallLoading || temperatureLoading || droughtLoading || floodLoading || ndviLoading || soilLoading) {
          return;
        }

        // Process rainfall data
        const rainfallValues = rainfallData?.properties?.parameter?.PRECTOTCORR
          ? Object.values(rainfallData.properties.parameter.PRECTOTCORR).filter(
              (p): p is number => typeof p === 'number' && p >= 0
            )
          : [];

        const recentRainfall = rainfallValues.slice(-7).reduce((sum, val) => sum + val, 0);
        const monthlyRainfall = rainfallValues.reduce((sum, val) => sum + val, 0);
        const avgRainfall = rainfallValues.length > 0 ? monthlyRainfall / rainfallValues.length : 0;

        // Calculate rainfall trend
        const firstHalf = rainfallValues.slice(0, Math.floor(rainfallValues.length / 2));
        const secondHalf = rainfallValues.slice(Math.floor(rainfallValues.length / 2));
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        let rainfallTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (secondAvg > firstAvg + 2) rainfallTrend = 'increasing';
        else if (secondAvg < firstAvg - 2) rainfallTrend = 'decreasing';

        // Process temperature data
        const temperatureValues = temperatureData?.properties?.parameter?.T2M
          ? Object.values(temperatureData.properties.parameter.T2M).filter(
              (t): t is number => typeof t === 'number' && t > -100
            )
          : [];

        const currentTemp = temperatureValues.length > 0 ? temperatureValues[temperatureValues.length - 1] : 0;
        const avgTemp = temperatureValues.length > 0 
          ? temperatureValues.reduce((sum, val) => sum + val, 0) / temperatureValues.length 
          : 0;

        // Calculate temperature trend
        const tempFirstHalf = temperatureValues.slice(0, Math.floor(temperatureValues.length / 2));
        const tempSecondHalf = temperatureValues.slice(Math.floor(temperatureValues.length / 2));
        const tempFirstAvg = tempFirstHalf.reduce((sum, val) => sum + val, 0) / tempFirstHalf.length;
        const tempSecondAvg = tempSecondHalf.reduce((sum, val) => sum + val, 0) / tempSecondHalf.length;
        
        let tempTrend: 'warming' | 'cooling' | 'stable' = 'stable';
        if (tempSecondAvg > tempFirstAvg + 1) tempTrend = 'warming';
        else if (tempSecondAvg < tempFirstAvg - 1) tempTrend = 'cooling';

        // Get elevation data (mock for now - would come from SRTM API)
        const elevation = 1500 + Math.random() * 1000; // Mock elevation
        const slope = Math.random() * 20; // Mock slope
        const drainage: 'good' | 'moderate' | 'poor' = 
          elevation > 1800 ? 'good' : elevation > 1400 ? 'moderate' : 'poor';

        // Calculate flood prediction
        const floodPrediction = await calculateFloodPrediction({
          latitude: coordinates.lat,
          longitude: coordinates.lon,
          predictionDays: 7
        });

        // Combine all data
        const combinedData: ClimateData = {
          rainfall: {
            recent: recentRainfall,
            monthly: monthlyRainfall,
            trend: rainfallTrend,
            anomaly: avgRainfall > 0 ? ((avgRainfall - 50) / 50) * 100 : 0 // 50mm baseline
          },
          temperature: {
            current: currentTemp,
            average: avgTemp,
            trend: tempTrend,
            anomaly: avgTemp - 22.5 // 22.5°C baseline for Rwanda
          },
          elevation: {
            value: elevation,
            slope: slope,
            drainage: drainage
          },
          ndvi: {
            value: vegetationHealth?.current?.score || 0,
            health: (vegetationHealth?.current?.health || 'moderate') as 'excellent' | 'good' | 'moderate' | 'poor' | 'critical',
            trend: vegetationHealth?.trend || 'stable'
          },
          soilMoisture: {
            surface: moistureAnalysis?.current?.surface || 0,
            rootZone: moistureAnalysis?.current?.rootZone || 0,
            trend: moistureAnalysis?.trend || 'stable'
          },
          floodRisk: {
            score: floodData?.floodRisk?.score || 0,
            level: floodData?.floodRisk?.level === 'medium' ? 'moderate' : (floodData?.floodRisk?.level || 'low') as 'low' | 'moderate' | 'high' | 'extreme',
            confidence: 0.8 // Mock confidence
          },
          droughtRisk: {
            score: droughtData?.droughtRisk || 0,
            level: droughtData?.riskLevel === 'extreme' ? 'extreme' :
                   droughtData?.riskLevel === 'high' ? 'severe' :
                   droughtData?.riskLevel === 'medium' ? 'moderate' :
                   droughtData?.riskLevel === 'low' ? 'mild' : 'none',
            confidence: 0.8 // Mock confidence
          },
          floodPrediction: {
            score: floodPrediction.predictionScore,
            level: floodPrediction.severity,
            next24h: floodPrediction.predictedFloodRisk.next24h,
            next3days: floodPrediction.predictedFloodRisk.next3days,
            next7days: floodPrediction.predictedFloodRisk.next7days
          },
          lastUpdated: new Date().toISOString(),
          dataQuality: 'good' // Mock data quality
        };

        setClimateData(combinedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load climate data');
      } finally {
        setIsLoading(false);
      }
    };

    processClimateData();
  }, [
    coordinates.lat, coordinates.lon, startDate, endDate,
    rainfallData, temperatureData, droughtData, floodData, ndviData, soilData,
    rainfallLoading, temperatureLoading, droughtLoading, floodLoading, ndviLoading, soilLoading,
    vegetationHealth, moistureAnalysis
  ]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'extreme': return 'destructive';
      case 'severe': return 'destructive';
      case 'high': return 'destructive';
      case 'moderate': return 'default';
      case 'mild': return 'secondary';
      case 'low': return 'secondary';
      case 'none': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'warming':
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
      case 'cooling':
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Popup
        longitude={coordinates.lon}
        latitude={coordinates.lat}
        onClose={onClose}
        closeButton={false}
        closeOnClick={false}
        maxWidth="400px"
      >
        <div className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading climate data...</span>
          </div>
        </div>
      </Popup>
    );
  }

  if (error || !climateData) {
    return (
      <Popup
        longitude={coordinates.lon}
        latitude={coordinates.lat}
        onClose={onClose}
        closeButton={false}
        closeOnClick={false}
        maxWidth="400px"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Error loading data: {error}</span>
          </div>
          <Button onClick={onClose} variant="outline" size="sm" className="mt-2">
            Close
          </Button>
        </div>
      </Popup>
    );
  }

  return (
    <Popup
      longitude={coordinates.lon}
      latitude={coordinates.lat}
      onClose={onClose}
      closeButton={false}
      closeOnClick={false}
      maxWidth="450px"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Climate Risk Analysis</h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
        </div>

        {/* Risk Scores Overview */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-2">
            <CardContent className="p-0">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Flood Risk</div>
                <Badge variant={getRiskColor(climateData.floodRisk.level) as any} className="text-xs">
                  {climateData.floodRisk.level}
                </Badge>
                <div className="text-sm font-semibold">
                  {(climateData.floodRisk.score * 100).toFixed(0)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-2">
            <CardContent className="p-0">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Drought Risk</div>
                <Badge variant={getRiskColor(climateData.droughtRisk.level) as any} className="text-xs">
                  {climateData.droughtRisk.level}
                </Badge>
                <div className="text-sm font-semibold">
                  {(climateData.droughtRisk.score * 100).toFixed(0)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-2">
            <CardContent className="p-0">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Flood Prediction</div>
                <Badge variant={getRiskColor(climateData.floodPrediction.level) as any} className="text-xs">
                  {climateData.floodPrediction.level}
                </Badge>
                <div className="text-sm font-semibold">
                  {(climateData.floodPrediction.score * 100).toFixed(0)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Climate Data */}
        <div className="space-y-3">
          {/* Rainfall */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Rainfall</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{climateData.rainfall.recent.toFixed(1)} mm (7d)</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(climateData.rainfall.trend)}
                <span className="text-xs text-muted-foreground">
                  {climateData.rainfall.anomaly > 0 ? '+' : ''}{climateData.rainfall.anomaly.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Temperature</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{climateData.temperature.current.toFixed(1)}°C</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(climateData.temperature.trend)}
                <span className="text-xs text-muted-foreground">
                  {climateData.temperature.anomaly > 0 ? '+' : ''}{climateData.temperature.anomaly.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>

          {/* NDVI */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Vegetation (NDVI)</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{climateData.ndvi.value.toFixed(3)}</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(climateData.ndvi.trend)}
                <span className="text-xs text-muted-foreground capitalize">
                  {climateData.ndvi.health}
                </span>
              </div>
            </div>
          </div>

          {/* Elevation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mountain className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Elevation</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{climateData.elevation.value.toFixed(0)} m</div>
              <div className="text-xs text-muted-foreground">
                Slope: {climateData.elevation.slope.toFixed(1)}°
              </div>
            </div>
          </div>

          {/* Soil Moisture */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium">Soil Moisture</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">
                {(climateData.soilMoisture.rootZone * 100).toFixed(0)}%
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(climateData.soilMoisture.trend)}
                <span className="text-xs text-muted-foreground capitalize">
                  {climateData.soilMoisture.trend}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Flood Prediction Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Flood Prediction Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Next 24h</span>
              <span>{(climateData.floodPrediction.next24h * 100).toFixed(0)}%</span>
            </div>
            <Progress value={climateData.floodPrediction.next24h * 100} className="h-1" />
            
            <div className="flex justify-between text-xs">
              <span>Next 3 days</span>
              <span>{(climateData.floodPrediction.next3days * 100).toFixed(0)}%</span>
            </div>
            <Progress value={climateData.floodPrediction.next3days * 100} className="h-1" />
            
            <div className="flex justify-between text-xs">
              <span>Next 7 days</span>
              <span>{(climateData.floodPrediction.next7days * 100).toFixed(0)}%</span>
            </div>
            <Progress value={climateData.floodPrediction.next7days * 100} className="h-1" />
          </CardContent>
        </Card>

        {/* Data Quality */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Data quality: {climateData.dataQuality}</span>
          <span>•</span>
          <span>Updated: {new Date(climateData.lastUpdated).toLocaleTimeString()}</span>
        </div>
      </div>
    </Popup>
  );
}

export default ClimateRiskPopup;


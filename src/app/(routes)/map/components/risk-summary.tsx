'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react';
import { useClickedCoordinates, useSelectedLocation } from '@/lib/store/map-store';
import { CoordinateDisplay } from '@/components/coordinate-display';
import { useLocationAnalytics } from '@/hooks/use-location-analytics';
import type { RiskLevel } from '@/types';

// Mock data - in production this would come from your API
const mockRiskData = {
  overall: {
    level: 'medium' as RiskLevel,
    score: 0.65,
    trend: 'increasing'
  },
  components: {
    rainfall: {
      level: 'high' as RiskLevel,
      score: 0.8,
      trend: 'increasing',
      description: 'Above average precipitation'
    },
    temperature: {
      level: 'medium' as RiskLevel,
      score: 0.6,
      trend: 'stable',
      description: 'Normal temperature range'
    },
    vegetation: {
      level: 'low' as RiskLevel,
      score: 0.3,
      trend: 'decreasing',
      description: 'Healthy vegetation conditions'
    },
    flood: {
      level: 'high' as RiskLevel,
      score: 0.75,
      trend: 'increasing',
      description: 'Elevated flood risk'
    },
    drought: {
      level: 'low' as RiskLevel,
      score: 0.25,
      trend: 'stable',
      description: 'Low drought risk'
    }
  },
  districts: [
    { name: 'Kigali', risk: 'high' as RiskLevel, score: 0.8 },
    { name: 'Eastern Province', risk: 'medium' as RiskLevel, score: 0.6 },
    { name: 'Northern Province', risk: 'low' as RiskLevel, score: 0.3 },
    { name: 'Southern Province', risk: 'medium' as RiskLevel, score: 0.55 },
    { name: 'Western Province', risk: 'high' as RiskLevel, score: 0.75 }
  ]
};

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'extreme':
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing': return <TrendingUp className="h-3 w-3 text-destructive" />;
    case 'decreasing': return <TrendingDown className="h-3 w-3 text-green-600" />;
    default: return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
};

export function RiskSummary() {
  const clickedCoordinates = useClickedCoordinates();
  const selectedLocation = useSelectedLocation();

  // Fetch real analytics data for clicked location
  const { data: analytics, isLoading, error } = useLocationAnalytics(
    clickedCoordinates?.lat,
    clickedCoordinates?.lon,
    !!clickedCoordinates
  );

  // Calculate overall risk from real data
  const calculateOverallRisk = () => {
    if (!analytics) return mockRiskData.overall;

    const floodScore = analytics.floodRisk.score;
    const droughtScore = analytics.droughtRisk.score;
    const overallScore = (floodScore + droughtScore) / 2;

    let level: RiskLevel = 'low';
    if (overallScore >= 0.75) level = 'extreme';
    else if (overallScore >= 0.5) level = 'high';
    else if (overallScore >= 0.25) level = 'medium';

    return {
      level,
      score: overallScore,
      trend: floodScore > droughtScore ? 'increasing' : 'stable'
    };
  };

  const calculateComponents = () => {
    if (!analytics) return mockRiskData.components;

    return {
      rainfall: {
        level: (analytics.rainfall.recent / 7 > 15 ? 'high' : analytics.rainfall.recent / 7 > 5 ? 'medium' : 'low') as RiskLevel,
        score: Math.min(1, analytics.rainfall.recent / 150),
        trend: 'stable',
        description: `${analytics.rainfall.recent.toFixed(1)}mm in last 7 days`
      },
      temperature: {
        level: (analytics.temperature.current > 28 ? 'high' : analytics.temperature.current > 22 ? 'medium' : 'low') as RiskLevel,
        score: Math.min(1, (analytics.temperature.current - 15) / 20),
        trend: 'stable',
        description: `Current: ${analytics.temperature.current.toFixed(1)}°C (Range: ${analytics.temperature.min.toFixed(1)}-${analytics.temperature.max.toFixed(1)}°C)`
      },
      flood: {
        level: analytics.floodRisk.level as RiskLevel,
        score: analytics.floodRisk.score,
        trend: analytics.rainfall.recent > analytics.rainfall.monthly / 4 ? 'increasing' : 'stable',
        description: analytics.floodRisk.details ?
          `Elevation: ${Math.round(analytics.floodRisk.details.factors.elevation.value)}m, Slope: ${analytics.floodRisk.details.factors.slope.value.toFixed(1)}°` :
          'Based on rainfall, elevation, and slope'
      },
      drought: {
        level: analytics.droughtRisk.level as RiskLevel,
        score: analytics.droughtRisk.score,
        trend: analytics.rainfall.recent < analytics.rainfall.monthly / 4 ? 'increasing' : 'decreasing',
        description: analytics.droughtRisk.details ?
          `Precipitation deficit: ${(analytics.droughtRisk.details.factors.precipitation.anomaly * 100).toFixed(0)}%` :
          'Based on precipitation patterns'
      }
    };
  };

  const overall = calculateOverallRisk();
  const components = calculateComponents();
  const { districts } = mockRiskData; // Keep districts as mock for now

  return (
    <div className="space-y-4">
      {/* Coordinate Display */}
      <CoordinateDisplay />

      {/* Loading indicator */}
      {isLoading && clickedCoordinates && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location-based data notice */}
      {clickedCoordinates && !isLoading && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-primary">
                  {analytics ? 'Live Risk Analysis' : 'Location Selected'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates:{' '}
                  <span className="font-mono">
                    {clickedCoordinates.lat.toFixed(4)}, {clickedCoordinates.lon.toFixed(4)}
                  </span>
                </p>
                {analytics && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Using real-time climate data
                  </p>
                )}
                {error && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠ Some data unavailable - showing available metrics
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Risk */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Overall Climate Risk</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={getRiskColor(overall.level) as "default" | "destructive" | "secondary" | "outline"}>
              {overall.level.toUpperCase()} RISK
            </Badge>
            <div className="flex items-center space-x-1">
              {getTrendIcon(overall.trend)}
              <span className="text-sm text-muted-foreground capitalize">
                {overall.trend}
              </span>
            </div>
          </div>
          <Progress value={overall.score * 100} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Risk Score: {(overall.score * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* Component Risks */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(components).map(([key, component]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{key}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant={getRiskColor(component.level) as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                    {component.level}
                  </Badge>
                  {getTrendIcon(component.trend)}
                </div>
              </div>
              <Progress value={component.score * 100} className="h-1" />
              <p className="text-xs text-muted-foreground">
                {component.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Risk Districts */}
      <Card>
        <CardHeader>
          <CardTitle>District Risk Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {districts
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((district, index) => (
                <div key={district.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm">{district.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={district.score * 100} className="w-16 h-1" />
                    <Badge variant={getRiskColor(district.risk) as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                      {(district.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

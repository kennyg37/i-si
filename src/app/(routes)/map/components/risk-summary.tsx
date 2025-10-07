'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react';
import { useClickedCoordinates, useSelectedLocation } from '@/lib/store/map-store';
import { CoordinateDisplay } from '@/components/coordinate-display';
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
  const { overall, components, districts } = mockRiskData;

  return (
    <div className="space-y-4">
      {/* Coordinate Display */}
      <CoordinateDisplay />

      {/* Location-based data notice */}
      {clickedCoordinates && (
        <Card className="border-primary">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-primary">Location Data</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Risk data below can be filtered for coordinates:{' '}
                  <span className="font-mono">
                    {clickedCoordinates.lat.toFixed(4)}, {clickedCoordinates.lon.toFixed(4)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  (Currently showing mock data - integrate with actual API using these coordinates)
                </p>
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

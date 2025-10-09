'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Thermometer, Droplets, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationAnalytics } from '@/hooks/use-location-analytics';
import { Skeleton } from '@/components/ui/skeleton';

interface LocationAnalyticsPanelProps {
  lat: number;
  lon: number;
  onClose: () => void;
}

export function LocationAnalyticsPanel({ lat, lon, onClose }: LocationAnalyticsPanelProps) {
  const { data, isLoading, error } = useLocationAnalytics(lat, lon, true);

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'extreme':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getRiskIcon = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel === 'extreme' || lowerLevel === 'high') {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <Info className="h-4 w-4" />;
  };

  if (error) {
    return (
      <div className="absolute top-4 right-4 z-20 w-80">
        <Card className="shadow-xl border-destructive">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Error Loading Data
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Failed to load analytics. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-20 w-80">
      <Card className="shadow-xl backdrop-blur-sm bg-background/95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Analytics
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {lat.toFixed(5)}°, {lon.toFixed(5)}°
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : data ? (
            <>
              {/* Temperature */}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Thermometer className="h-4 w-4 text-orange-500" />
                    Temperature
                  </div>
                  <span className="text-lg font-bold">
                    {data.temperature.current.toFixed(1)}{data.temperature.unit}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min: {data.temperature.min.toFixed(1)}{data.temperature.unit}</span>
                  <span>Max: {data.temperature.max.toFixed(1)}{data.temperature.unit}</span>
                </div>
              </div>

              {/* Rainfall */}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Rainfall
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <div>
                    <div className="text-muted-foreground">Last 7 days</div>
                    <div className="font-semibold">{data.rainfall.recent.toFixed(1)} {data.rainfall.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Last 30 days</div>
                    <div className="font-semibold">{data.rainfall.monthly.toFixed(1)} {data.rainfall.unit}</div>
                  </div>
                </div>
              </div>

              {/* Flood Risk */}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    Flood Risk
                  </div>
                  <Badge className={getRiskColor(data.floodRisk.level)}>
                    <span className="flex items-center gap-1">
                      {getRiskIcon(data.floodRisk.level)}
                      {data.floodRisk.level}
                    </span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 transition-all"
                      style={{ width: `${data.floodRisk.score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">
                    {(data.floodRisk.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Drought Risk */}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Drought Risk
                  </div>
                  <Badge className={getRiskColor(data.droughtRisk.level)}>
                    <span className="flex items-center gap-1">
                      {getRiskIcon(data.droughtRisk.level)}
                      {data.droughtRisk.level}
                    </span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 transition-all"
                      style={{ width: `${data.droughtRisk.score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">
                    {(data.droughtRisk.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Updated: {data.timestamp.toLocaleTimeString()}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

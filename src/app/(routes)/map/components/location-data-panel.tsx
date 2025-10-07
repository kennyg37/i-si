'use client';

import { useEffect } from 'react';
import { useClickedCoordinates } from '@/lib/store/map-store';
import { useRainfallData, useTemperatureData, useElevationData } from '@/lib/hooks/use-climate-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CloudRain, Thermometer, Mountain, TrendingUp } from 'lucide-react';
import type { Coordinates } from '@/types';

/**
 * Example component demonstrating how to use clicked coordinates
 * from the map store to fetch and display location-specific data
 */
export function LocationDataPanel() {
  const clickedCoordinates = useClickedCoordinates();

  if (!clickedCoordinates) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Click on the map to view location-specific climate data
          </p>
        </CardContent>
      </Card>
    );
  }

  return <LocationData coordinates={clickedCoordinates} />;
}

function LocationData({ coordinates }: { coordinates: Coordinates }) {
  const { lat, lon } = coordinates;

  // Calculate date ranges for API calls
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Use the coordinates to fetch real data from APIs
  const { data: rainfallData, isLoading: rainfallLoading, error: rainfallError } = useRainfallData(
    lat,
    lon,
    startDate,
    endDate
  );

  const { data: temperatureData, isLoading: tempLoading, error: tempError } = useTemperatureData(
    lat,
    lon,
    startDate,
    endDate
  );

  const { data: elevationData, isLoading: elevationLoading, error: elevationError } = useElevationData(
    lat,
    lon
  );

  useEffect(() => {
    console.log('Fetching data for coordinates:', { lat, lon });
    console.log('Date range:', { startDate, endDate });
  }, [lat, lon, startDate, endDate]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Location Climate Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">
            Showing data for: <span className="font-mono">{lat.toFixed(4)}°, {lon.toFixed(4)}°</span>
          </div>

          {/* Rainfall Data */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CloudRain className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Rainfall (30 days)</span>
                  {rainfallLoading && <Skeleton className="h-4 w-16" />}
                </div>
                {rainfallError && (
                  <p className="text-xs text-destructive">Error loading rainfall data</p>
                )}
                {rainfallData && (
                  <div className="text-xs text-muted-foreground">
                    <p>Data fetched for coordinates</p>
                    <p className="font-mono mt-1">
                      {Object.keys(rainfallData.properties?.parameter?.PRECTOT || {}).length} data points
                    </p>
                  </div>
                )}
                {!rainfallData && !rainfallLoading && !rainfallError && (
                  <p className="text-xs text-muted-foreground italic">
                    API credentials required for real data
                  </p>
                )}
              </div>
            </div>

            {/* Temperature Data */}
            <div className="flex items-start gap-3">
              <Thermometer className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Temperature</span>
                  {tempLoading && <Skeleton className="h-4 w-16" />}
                </div>
                {tempError && (
                  <p className="text-xs text-destructive">Error loading temperature data</p>
                )}
                {temperatureData && (
                  <div className="text-xs text-muted-foreground">
                    <p>Data fetched for coordinates</p>
                    <p className="font-mono mt-1">
                      {Object.keys(temperatureData.properties?.parameter?.T2M || {}).length} data points
                    </p>
                  </div>
                )}
                {!temperatureData && !tempLoading && !tempError && (
                  <p className="text-xs text-muted-foreground italic">
                    API credentials required for real data
                  </p>
                )}
              </div>
            </div>

            {/* Elevation Data */}
            <div className="flex items-start gap-3">
              <Mountain className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Elevation</span>
                  {elevationLoading && <Skeleton className="h-4 w-16" />}
                </div>
                {elevationError && (
                  <p className="text-xs text-destructive">Error loading elevation data</p>
                )}
                {elevationData && (
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium">{elevationData.elevation.toFixed(0)}m</p>
                    <p className="mt-1">Slope: {elevationData.slope.toFixed(1)}°</p>
                  </div>
                )}
                {!elevationData && !elevationLoading && !elevationError && (
                  <p className="text-xs text-muted-foreground italic">
                    API credentials required for real data
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Developer Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-xs flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            For Developers
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <p className="font-medium">Using coordinates in your components:</p>
          <div className="bg-background p-2 rounded font-mono text-[10px]">
            <pre>{`import { useClickedCoordinates } from '@/lib/store/map-store';

const coords = useClickedCoordinates();
// coords.lat, coords.lon`}</pre>
          </div>
          <p className="text-muted-foreground">
            The coordinates are automatically updated when the user clicks the map.
            Use them to fetch location-specific data from any API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

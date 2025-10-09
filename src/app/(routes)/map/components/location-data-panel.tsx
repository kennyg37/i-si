'use client';

import { useEffect } from 'react';
import { useClickedCoordinates } from '@/lib/store/map-store';
import { useRainfallData, useTemperatureData, useElevationData } from '@/lib/hooks/use-climate-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CloudRain, Thermometer, Mountain } from 'lucide-react';
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
          <CardTitle className="text-sm">Location Climate Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 pb-3 border-b">
            <div className="text-xs font-medium text-muted-foreground mb-1">Selected Coordinates</div>
            <div className="font-mono text-sm font-semibold">
              {lat.toFixed(6)}°N, {lon.toFixed(6)}°E
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last updated: {new Date().toLocaleString()}
            </div>
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
                  <div className="text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Recent (30d)</span>
                      <span className="font-semibold">
                        {(() => {
                          const values = Object.values(rainfallData.properties?.parameter?.PRECTOT || {}).filter(
                            (v): v is number => typeof v === 'number'
                          );
                          const total = values.reduce((sum, v) => sum + v, 0);
                          return `${total.toFixed(1)} mm`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">Data points</span>
                      <span className="font-mono text-xs">
                        {Object.keys(rainfallData.properties?.parameter?.PRECTOT || {}).length}
                      </span>
                    </div>
                  </div>
                )}
                {!rainfallData && !rainfallLoading && !rainfallError && (
                  <p className="text-xs text-amber-600 italic">
                    Configure API credentials to access real-time data
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
                  <div className="text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Average</span>
                      <span className="font-semibold">
                        {(() => {
                          const values = Object.values(temperatureData.properties?.parameter?.T2M || {}).filter(
                            (v): v is number => typeof v === 'number' && v > -100
                          );
                          const avg = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
                          return `${avg.toFixed(1)}°C`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">Range</span>
                      <span className="text-xs">
                        {(() => {
                          const values = Object.values(temperatureData.properties?.parameter?.T2M || {}).filter(
                            (v): v is number => typeof v === 'number' && v > -100
                          );
                          if (values.length === 0) return 'N/A';
                          const min = Math.min(...values);
                          const max = Math.max(...values);
                          return `${min.toFixed(1)}°C - ${max.toFixed(1)}°C`;
                        })()}
                      </span>
                    </div>
                  </div>
                )}
                {!temperatureData && !tempLoading && !tempError && (
                  <p className="text-xs text-amber-600 italic">
                    Configure API credentials to access real-time data
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
                  <div className="text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Altitude</span>
                      <span className="font-semibold">{elevationData.elevation.toFixed(0)}m</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">Slope</span>
                      <span className="font-semibold">{elevationData.slope.toFixed(1)}°</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">Terrain</span>
                      <span className="text-xs">
                        {elevationData.slope < 2 ? 'Flat' :
                         elevationData.slope < 10 ? 'Gentle' :
                         elevationData.slope < 20 ? 'Moderate' : 'Steep'}
                      </span>
                    </div>
                  </div>
                )}
                {!elevationData && !elevationLoading && !elevationError && (
                  <p className="text-xs text-amber-600 italic">
                    Configure API credentials to access real-time data
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

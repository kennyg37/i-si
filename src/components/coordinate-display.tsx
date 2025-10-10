'use client';

import { useClickedCoordinates, useSelectedLocation } from '@/lib/store/map-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

export function CoordinateDisplay() {
  const clickedCoordinates = useClickedCoordinates();
  const selectedLocation = useSelectedLocation();

  if (!clickedCoordinates) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            No Location Selected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Click on the map to select a location
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Selected Coordinates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Latitude</div>
            <div className="font-mono font-medium">
              {clickedCoordinates.lat.toFixed(6)}°
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Longitude</div>
            <div className="font-mono font-medium">
              {clickedCoordinates.lon.toFixed(6)}°
            </div>
          </div>
        </div>

        {selectedLocation && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">Location Info</div>
            <div className="text-sm">
              {selectedLocation.name || 'Custom Location'}
            </div>
            {selectedLocation.district && (
              <div className="text-xs text-muted-foreground">
                {selectedLocation.district}
                {selectedLocation.province && `, ${selectedLocation.province}`}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

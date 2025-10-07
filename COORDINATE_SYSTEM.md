# Coordinate System Documentation

This document explains how the coordinate system works in the I-si Climate Risk Platform and how to use coordinates throughout the application.

## Overview

The application uses a centralized state management system (Zustand) to share clicked map coordinates across all components. When a user clicks anywhere on the map, the coordinates are captured and made available globally.

## Architecture

### 1. Type System ([src/types/index.ts](src/types/index.ts))

All coordinate-related types are centrally defined:

```typescript
export interface Coordinates {
  lat: number;  // Latitude
  lon: number;  // Longitude
}

export interface GeoLocation {
  coordinates: Coordinates;
  name?: string;
  district?: string;
  province?: string;
  elevation?: number;
}

export interface MapClickEvent {
  coordinates: Coordinates;
  timestamp: Date;
  features?: GeoJSON.Feature[];
}
```

### 2. State Management ([src/lib/store/map-store.ts](src/lib/store/map-store.ts))

The Zustand store manages all map-related state:

```typescript
interface MapState {
  selectedLocation: GeoLocation | null;
  clickedCoordinates: Coordinates | null;
  viewport: MapViewport;
  markers: MapMarker[];
  activeLayers: LayerType[];
  // ... actions
}
```

#### Key Actions:
- `setClickedCoordinates(coordinates)` - Update clicked coordinates
- `handleMapClick(event)` - Handle map click events
- `setSelectedLocation(location)` - Set full location details
- `addMarker(marker)` - Add a marker to the map
- `clearMarkers()` - Clear all markers

#### Selectors (Optimized):
```typescript
import { useClickedCoordinates, useSelectedLocation } from '@/lib/store/map-store';

function MyComponent() {
  const coordinates = useClickedCoordinates();
  const location = useSelectedLocation();
  // Use coordinates to fetch data, display info, etc.
}
```

### 3. Map Component ([src/app/(routes)/map/components/map-container.tsx](src/app/(routes)/map/components/map-container.tsx))

The map component captures clicks and updates the store:

#### Features:
- **Click Detection**: Captures lat/lon on every map click
- **Visual Feedback**: Shows popup and toast notification
- **Persistent Display**: Bottom-left coordinate panel
- **Markers**: Animated markers for selected locations
- **Copy to Clipboard**: Easy coordinate copying

#### Implementation:
```typescript
const onMapClick = useCallback((event: MapLayerMouseEvent) => {
  const coordinates: Coordinates = {
    lat: event.lngLat.lat,
    lon: event.lngLat.lng,
  };

  handleMapClick({
    coordinates,
    timestamp: new Date(),
    features: event.features,
  });
}, [handleMapClick]);

<Map onClick={onMapClick} ... />
```

## Usage Examples

### 1. Display Coordinates in UI

```typescript
import { useClickedCoordinates } from '@/lib/store/map-store';

export function CoordinateDisplay() {
  const coordinates = useClickedCoordinates();

  if (!coordinates) {
    return <p>No location selected</p>;
  }

  return (
    <div>
      <p>Lat: {coordinates.lat.toFixed(6)}°</p>
      <p>Lon: {coordinates.lon.toFixed(6)}°</p>
    </div>
  );
}
```

### 2. Fetch Data Based on Coordinates

```typescript
import { useClickedCoordinates } from '@/lib/store/map-store';
import { useRainfallData } from '@/lib/hooks/use-climate-data';

export function WeatherPanel() {
  const coordinates = useClickedCoordinates();

  const { data, isLoading } = useRainfallData(
    coordinates?.lat || 0,
    coordinates?.lon || 0,
    startDate,
    endDate
  );

  if (!coordinates) return <p>Click map to view weather</p>;
  if (isLoading) return <p>Loading...</p>;

  return <div>{/* Render weather data */}</div>;
}
```

### 3. Conditional Rendering Based on Selection

```typescript
import { useSelectedLocation } from '@/lib/store/map-store';

export function LocationInfo() {
  const location = useSelectedLocation();

  if (!location) {
    return <EmptyState />;
  }

  return (
    <Card>
      <h3>{location.name}</h3>
      <p>District: {location.district}</p>
      <p>Coordinates: {location.coordinates.lat}, {location.coordinates.lon}</p>
    </Card>
  );
}
```

### 4. Programmatically Set Location

```typescript
import { useMapStore } from '@/lib/store/map-store';

export function CitySelector() {
  const { setSelectedLocation } = useMapStore();

  const selectKigali = () => {
    setSelectedLocation({
      coordinates: { lat: -1.9441, lon: 30.0619 },
      name: 'Kigali',
      district: 'Kigali City',
      province: 'Kigali'
    });
  };

  return <button onClick={selectKigali}>Go to Kigali</button>;
}
```

### 5. React to Coordinate Changes

```typescript
import { useEffect } from 'react';
import { useClickedCoordinates } from '@/lib/store/map-store';

export function DataFetcher() {
  const coordinates = useClickedCoordinates();

  useEffect(() => {
    if (coordinates) {
      console.log('New location selected:', coordinates);
      // Fetch data, update analytics, etc.
    }
  }, [coordinates]);

  return null;
}
```

## API Integration

### Using Coordinates with Climate Data APIs

```typescript
// 1. Get coordinates from store
const coordinates = useClickedCoordinates();

// 2. Use with NASA POWER API
const { data: rainfall } = useRainfallData(
  coordinates.lat,
  coordinates.lon,
  '20240101',
  '20240131'
);

// 3. Use with CHIRPS API
const { data: droughtRisk } = useDroughtRisk(
  coordinates.lat,
  coordinates.lon,
  '2024-01-01',
  '2024-01-31'
);

// 4. Use with Elevation API
const { data: elevation } = useElevationData(
  coordinates.lat,
  coordinates.lon,
  1000 // radius in meters
);
```

## State Persistence

The map store persists certain fields to localStorage:

- `viewport` - Current map view (zoom, center)
- `activeLayers` - Selected map layers

**Not persisted** (resets on page reload):
- `selectedLocation`
- `clickedCoordinates`
- `markers`

## Best Practices

### 1. Type Safety
Always import and use the centralized types:
```typescript
import type { Coordinates, GeoLocation } from '@/types';
```

### 2. Null Checks
Always check if coordinates exist before using:
```typescript
const coordinates = useClickedCoordinates();

if (!coordinates) {
  return <EmptyState />;
}

// Safe to use coordinates here
fetchData(coordinates.lat, coordinates.lon);
```

### 3. Optimized Selectors
Use specific selectors instead of the full store:
```typescript
// ✅ Good - only re-renders when coordinates change
const coordinates = useClickedCoordinates();

// ❌ Bad - re-renders on any store change
const { clickedCoordinates } = useMapStore();
```

### 4. Component Organization
Create small, focused components that use coordinates:
```typescript
// Good pattern
<LocationDataPanel />  // Uses coordinates internally
<WeatherDisplay />     // Uses coordinates internally
<ElevationChart />     // Uses coordinates internally
```

## Debugging

### View Current State
```typescript
import { useMapStore } from '@/lib/store/map-store';

// In component
const store = useMapStore();
console.log('Current state:', {
  coordinates: store.clickedCoordinates,
  location: store.selectedLocation,
  markers: store.markers
});
```

### Redux DevTools
The store is configured with Redux DevTools support. Open browser DevTools and look for the "Redux" tab to inspect state changes.

## File Structure

```
src/
├── types/
│   └── index.ts                    # All TypeScript types
├── lib/
│   ├── store/
│   │   └── map-store.ts            # Zustand store
│   ├── hooks/
│   │   └── use-climate-data.ts     # React Query hooks
│   └── utils/
│       └── geo-utils.ts            # Geographic utilities
├── app/
│   └── (routes)/
│       └── map/
│           ├── page.tsx            # Map page
│           └── components/
│               ├── map-container.tsx          # Main map with click handling
│               ├── location-data-panel.tsx    # Example: Uses coordinates
│               └── risk-summary.tsx           # Example: Uses coordinates
└── components/
    └── coordinate-display.tsx      # Reusable coordinate display
```

## Migration Notes

If upgrading from hardcoded coordinates:

1. Remove local coordinate state
2. Import the store: `import { useClickedCoordinates } from '@/lib/store/map-store'`
3. Replace local state with store selector
4. Update prop drilling to use store directly

## Future Enhancements

Potential improvements to the coordinate system:

- [ ] History of clicked locations
- [ ] Favorite/saved locations
- [ ] Coordinate search (geocoding)
- [ ] Snap to grid/district boundaries
- [ ] Multi-point selection
- [ ] Export coordinates to CSV/JSON
- [ ] Share location via URL parameters

## Support

For questions or issues with the coordinate system:
- Check the type definitions in [src/types/index.ts](src/types/index.ts)
- Review the store implementation in [src/lib/store/map-store.ts](src/lib/store/map-store.ts)
- See usage examples in [src/app/(routes)/map/components/](src/app/(routes)/map/components/)

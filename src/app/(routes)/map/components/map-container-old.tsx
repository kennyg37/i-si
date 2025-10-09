'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Map, { MapRef, Source, Layer, Marker, Popup } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'react-map-gl/mapbox';
import { RWANDA_CENTER, RWANDA_BOUNDS, getRwandaZoomLevel, bboxToArray } from '@/lib/utils/geo-utils';
import { MapSkeleton } from '@/components/loading-skeleton';
import { ErrorBoundary } from '@/components/error-boundary';
import { useMapStore } from '@/lib/store/map-store';
import type { Coordinates, GeoLocation, MapClickEvent } from '@/types';
import { MapPin, X, Locate, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { sentinelHubAPI } from '@/lib/api/sentinel-hub';
import { useFloodRiskGrid, floodRiskToGeoJSON } from '@/hooks/use-flood-risk';
import { useGeolocation } from '@/hooks/use-geolocation';
import { LocationAnalyticsPanel } from '@/components/location-analytics-panel';

interface MapContainerProps {
  selectedLayers: string[];
  timeRange: string;
  mapStyle: string;
}

export function MapContainer({ selectedLayers, timeRange, mapStyle }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupCoordinates, setPopupCoordinates] = useState<Coordinates | null>(null);
  const [mapboxToken] = useState(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsCoordinates, setAnalyticsCoordinates] = useState<Coordinates | null>(null);

  // Geolocation hook
  const { coordinates: geoCoordinates, isLoading: isGeoLoading, error: geoError, getLocation } = useGeolocation();

  // Calculate minZoom based on active layers
  const minZoom = useMemo(() => {
    if (selectedLayers.includes('flood-sar')) return 7;
    if (selectedLayers.includes('ndvi')) return 8;
    return 6; // Default minimum zoom
  }, [selectedLayers]);

  // Track current zoom level for layer visibility management
  const [currentZoom, setCurrentZoom] = useState<number>(getRwandaZoomLevel());

  // NDVI max zoom level (200m/pixel is approximately zoom level 12-13)
  const NDVI_MAX_ZOOM = 13;

  // Fetch flood risk data for Rwanda
  const rwandaBbox = useMemo(() => bboxToArray(RWANDA_BOUNDS), []);
  const { data: floodRiskData, isLoading: isLoadingFloodRisk } = useFloodRiskGrid(
    rwandaBbox,
    8, // 8x8 grid = 64 points across Rwanda
    selectedLayers.includes('flood-risk')
  );

  // Convert flood risk data to GeoJSON
  const floodRiskGeoJSON = useMemo(() => {
    if (!floodRiskData || floodRiskData.length === 0) {
      return {
        type: 'FeatureCollection' as const,
        features: [],
      };
    }
    return floodRiskToGeoJSON(floodRiskData);
  }, [floodRiskData]);

  // Zustand store
  const {
    selectedLocation,
    clickedCoordinates,
    markers,
    isMapLoaded,
    setMapLoaded,
    handleMapClick,
    setViewport,
    setSelectedLocation,
    clearMarkers
  } = useMapStore();

  // Handle map load
  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    console.log('Map loaded successfully');
    
    // Force map to resize and update its container
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.resize();
    }
  }, [setMapLoaded]);

  // Handle map click with animated zoom using flyTo
  const onMapClick = useCallback((event: MapMouseEvent) => {
    const { lngLat } = event;

    const coordinates: Coordinates = {
      lat: lngLat.lat,
      lon: lngLat.lng,
    };

    const clickEvent: MapClickEvent = {
      coordinates,
      timestamp: new Date(),
      features: event.features,
    };

    // Update store with clicked coordinates
    handleMapClick(clickEvent);

    // Show analytics panel for clicked location
    setAnalyticsCoordinates(coordinates);
    setShowAnalytics(true);

    // Animate zoom to clicked location using flyTo
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 12, // Zoom level (adjust as needed: 10-15 for different detail levels)
        duration: 1500, // Animation duration in milliseconds
        essential: true, // This animation is considered essential with respect to prefers-reduced-motion
      });
    }

    // Show toast notification with coordinates
    toast.success(
      `Location selected: ${coordinates.lat.toFixed(5)}°, ${coordinates.lon.toFixed(5)}°`,
      {
        duration: 3000,
        icon: '📍',
      }
    );

    console.log('Map clicked:', {
      lat: coordinates.lat,
      lon: coordinates.lon,
      features: event.features?.length || 0,
    });
  }, [handleMapClick]);

  // Handle map move to update viewport state
  const handleMove = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bearing = map.getBearing();
    const pitch = map.getPitch();

    // Update current zoom level
    setCurrentZoom(zoom);

    // Update viewport with the new values
    setViewport({
      latitude: center.lat,
      longitude: center.lng,
      zoom,
      bearing,
      pitch,
    });
  }, []); // Empty dependencies to prevent recreation

  // Copy coordinates to clipboard
  const copyToClipboard = useCallback((coords: Coordinates) => {
    const text = `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    toast.success('Coordinates copied to clipboard!');
  }, []);

  // Close popup
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setPopupCoordinates(null);
  }, []);

  // Clear all markers and selection
  const handleClearSelection = useCallback(() => {
    clearMarkers();
    setSelectedLocation(null);
    setShowPopup(false);
    setPopupCoordinates(null);
    setShowAnalytics(false);
    setAnalyticsCoordinates(null);
    toast('Selection cleared', { icon: '🗑️' });
  }, [clearMarkers, setSelectedLocation]);

  // Handle Pin Me button click
  const handlePinMe = useCallback(() => {
    getLocation();
  }, [getLocation]);

  // Handle when geolocation coordinates are received
  useEffect(() => {
    if (geoCoordinates && !geoError) {
      // Update map view
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [geoCoordinates.lon, geoCoordinates.lat],
          zoom: 13,
          duration: 2000,
          essential: true,
        });
      }

      // Set analytics coordinates
      setAnalyticsCoordinates(geoCoordinates);
      setShowAnalytics(true);

      // Update store
      handleMapClick({
        coordinates: geoCoordinates,
        timestamp: new Date(),
      });

      toast.success(
        `Your location: ${geoCoordinates.lat.toFixed(5)}°, ${geoCoordinates.lon.toFixed(5)}°`,
        {
          duration: 3000,
          icon: '📍',
        }
      );
    }
  }, [geoCoordinates, geoError, handleMapClick]);

  // Handle geolocation error
  useEffect(() => {
    if (geoError) {
      toast.error(geoError, {
        duration: 5000,
      });
    }
  }, [geoError]);

  // Fit map to Rwanda bounds when loaded (once only)
  const hasInitializedBounds = useRef(false);
  useEffect(() => {
    if (mapRef.current && isMapLoaded && !hasInitializedBounds.current) {
      hasInitializedBounds.current = true;
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.fitBounds(
            [
              [RWANDA_BOUNDS.west, RWANDA_BOUNDS.south],
              [RWANDA_BOUNDS.east, RWANDA_BOUNDS.north],
            ],
            {
              padding: 50,
              duration: 1000,
            }
          );
        }
      }, 100);
    }
  }, [isMapLoaded]);

  // Handle window resize to fix map container issues
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current && isMapLoaded) {
        const map = mapRef.current.getMap();
        map.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMapLoaded]);

  if (!mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center max-w-md p-6">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-muted-foreground text-sm">
            Please add <code className="bg-muted px-2 py-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to your environment variables.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Get your token at{' '}
            <a
              href="https://mapbox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-full">
        {/* Pin Me Button */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handlePinMe}
            disabled={isGeoLoading}
            className="shadow-lg"
          >
            <Locate className={`h-4 w-4 mr-2 ${isGeoLoading ? 'animate-spin' : ''}`} />
            {isGeoLoading ? 'Locating...' : 'Pin Me'}
          </Button>

          {/* Clear Selection Button */}
          {(selectedLocation || markers.length > 0 || showAnalytics) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearSelection}
              className="shadow-lg"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Zoom level warning for NDVI layer */}
        {selectedLayers.includes('ndvi') && currentZoom > NDVI_MAX_ZOOM && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-amber-500/95 backdrop-blur-sm border border-amber-600 rounded-lg p-3 shadow-lg max-w-md">
            <div className="flex items-center gap-2 text-sm text-amber-950">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                NDVI layer hidden - zoom out to see vegetation data (resolution limit: 200m/pixel)
              </span>
            </div>
          </div>
        )}

        {/* Location Analytics Panel */}
        {showAnalytics && analyticsCoordinates && (
          <LocationAnalyticsPanel
            lat={analyticsCoordinates.lat}
            lon={analyticsCoordinates.lon}
            onClose={() => {
              setShowAnalytics(false);
              setAnalyticsCoordinates(null);
            }}
          />
        )}

        {/* Coordinate Display */}
        {clickedCoordinates && (
          <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="text-xs text-muted-foreground mb-1">Selected Location</div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-sm">
                <span className="font-semibold">Lat:</span> {clickedCoordinates.lat.toFixed(6)}°
                <span className="mx-2">|</span>
                <span className="font-semibold">Lon:</span> {clickedCoordinates.lon.toFixed(6)}°
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(clickedCoordinates)}
                className="h-7 px-2"
              >
                Copy
              </Button>
            </div>
          </div>
        )}

        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: RWANDA_CENTER.lon,
            latitude: RWANDA_CENTER.lat,
            zoom: getRwandaZoomLevel(),
            bearing: 0,
            pitch: 0,
          }}
          minZoom={minZoom}
          maxZoom={18}
          style={{ width: '100%', height: '100%' }}
          mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
          onLoad={handleMapLoad}
          onClick={onMapClick}
          onMove={handleMove}
          onMoveEnd={handleMove}
          interactiveLayerIds={['rainfall-layer', 'ndvi-layer', 'ndvi-placeholder-layer', 'moisture-stress-layer', 'flood-risk-layer', 'drought-risk-layer', 'flood-sar-layer']}
          cursor="crosshair"
          attributionControl={false}
          preserveDrawingBuffer={true}
          reuseMaps={true}
        >
          {/* Rainfall Layer */}
          {selectedLayers.includes('rainfall') && (
            <Source
              id="rainfall"
              type="raster"
              tiles={[
                // Placeholder - replace with actual rainfall tiles
                `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
              ]}
              tileSize={256}
            >
              <Layer
                id="rainfall-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.5,
                }}
              />
            </Source>
          )}

          {/* NDVI Layer - Sentinel Hub (disabled when zoomed in past 200m/pixel resolution) */}
          {selectedLayers.includes('ndvi') && currentZoom <= NDVI_MAX_ZOOM && sentinelHubAPI.isConfigured() && sentinelHubAPI.getXYZTileURL() && (
            <Source
              id="ndvi"
              type="raster"
              tiles={[
                sentinelHubAPI.getXYZTileURL(),
              ]}
              tileSize={256}
              scheme="xyz"
            >
              <Layer
                id="ndvi-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.7,
                }}
              />
            </Source>
          )}

          {/* NDVI Layer fallback - placeholder when Sentinel Hub not configured (disabled when zoomed in past 200m/pixel) */}
          {selectedLayers.includes('ndvi') && currentZoom <= NDVI_MAX_ZOOM && (!sentinelHubAPI.isConfigured() || !sentinelHubAPI.getXYZTileURL()) && (
            <Source
              id="ndvi-placeholder"
              type="raster"
              tiles={[
                // Temporary: Using Mapbox satellite as placeholder for NDVI
                `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
              ]}
              tileSize={256}
            >
              <Layer
                id="ndvi-placeholder-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.6,
                  'raster-saturation': 0.3, // Slightly desaturated to indicate it's vegetation-focused
                }}
              />
            </Source>
          )}

          {/* Sentinel-2 Moisture Stress Index Layer (for drought/disaster monitoring) */}
          {selectedLayers.includes('moisture-stress') && currentZoom <= NDVI_MAX_ZOOM && sentinelHubAPI.isMoistureConfigured() && sentinelHubAPI.getMoistureTileURL() && (
            <Source
              id="moisture-stress"
              type="raster"
              tiles={[
                sentinelHubAPI.getMoistureTileURL(),
              ]}
              tileSize={256}
              scheme="xyz"
            >
              <Layer
                id="moisture-stress-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.7,
                }}
              />
            </Source>
          )}

          {/* Sentinel-1 SAR Flood Detection Layer */}
          {selectedLayers.includes('flood-sar') && sentinelHubAPI.isFloodConfigured() && sentinelHubAPI.getFloodTileURL() && (
            <Source
              id="flood-sar"
              type="raster"
              tiles={[
                sentinelHubAPI.getFloodTileURL(),
              ]}
              tileSize={512}
            >
              <Layer
                id="flood-sar-layer"
                type="raster"
                paint={{
                  'raster-opacity': 0.7,
                }}
              />
            </Source>
          )}

          {/* SAR fallback when not configured */}
          {selectedLayers.includes('flood-sar') && (!sentinelHubAPI.isFloodConfigured() || !sentinelHubAPI.getFloodTileURL()) && (
            <Source
              id="flood-sar-placeholder"
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: []
              }}
            >
              <Layer
                id="flood-sar-layer"
                type="fill"
                paint={{
                  'fill-color': '#ff0000',
                  'fill-opacity': 0,
                }}
              />
            </Source>
          )}

          {/* CHIRPS+SRTM Flood Risk Model Layer - Dynamic Data */}
          {selectedLayers.includes('flood-risk') && (
            <Source
              id="flood-risk"
              type="geojson"
              data={floodRiskGeoJSON}
            >
              <Layer
                id="flood-risk-layer"
                type="fill"
                paint={{
                  'fill-color': [
                    'match',
                    ['get', 'risk'],
                    'extreme', '#8B0000',    // Dark red
                    'high', '#FF0000',       // Red
                    'medium', '#FFA500',     // Orange
                    'low', '#FFFF00',        // Yellow
                    '#90EE90'                // Light green (default)
                  ],
                  'fill-opacity': [
                    'interpolate',
                    ['linear'],
                    ['get', 'score'],
                    0, 0.2,      // Low risk - more transparent
                    0.5, 0.4,    // Medium risk
                    1, 0.6       // High risk - more opaque
                  ],
                }}
              />
              <Layer
                id="flood-risk-outline"
                type="line"
                paint={{
                  'line-color': [
                    'match',
                    ['get', 'risk'],
                    'extreme', '#8B0000',
                    'high', '#FF0000',
                    'medium', '#FFA500',
                    'low', '#FFD700',
                    '#98FB98'
                  ],
                  'line-width': 2,
                  'line-opacity': 0.8,
                }}
              />
              {/* Labels showing risk level */}
              <Layer
                id="flood-risk-labels"
                type="symbol"
                layout={{
                  'text-field': ['get', 'name'],
                  'text-size': 10,
                  'text-anchor': 'center',
                }}
                paint={{
                  'text-color': '#000000',
                  'text-halo-color': '#FFFFFF',
                  'text-halo-width': 1,
                }}
              />
            </Source>
          )}

          {/* Loading indicator for flood risk */}
          {selectedLayers.includes('flood-risk') && isLoadingFloodRisk && (
            <div className="absolute top-20 left-4 z-10 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-sm">Loading flood risk data...</span>
              </div>
            </div>
          )}

          {/* Drought Risk Layer */}
          {selectedLayers.includes('drought') && (
            <Source
              id="drought-risk"
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    properties: { risk: 'medium', name: 'Moderate Drought Risk' },
                    geometry: {
                      type: 'Polygon',
                      coordinates: [
                        [
                          [28.8, -2.5],
                          [29.5, -2.5],
                          [29.5, -2.8],
                          [28.8, -2.8],
                          [28.8, -2.5],
                        ],
                      ],
                    },
                  },
                ],
              }}
            >
              <Layer
                id="drought-risk-layer"
                type="fill"
                paint={{
                  'fill-color': ['case', ['==', ['get', 'risk'], 'high'], '#8b0000', ['==', ['get', 'risk'], 'medium'], '#ffa500', '#ffff00'],
                  'fill-opacity': 0.3,
                }}
              />
              <Layer
                id="drought-risk-outline"
                type="line"
                paint={{
                  'line-color': '#8b0000',
                  'line-width': 2,
                  'line-opacity': 0.6,
                }}
              />
            </Source>
          )}

          {/* Markers and popups removed for now - coordinates shown in bottom-left panel */}

          {/* Bold country borders layer */}
          <Source
            id="country-boundaries"
            type="vector"
            url="mapbox://mapbox.country-boundaries-v1"
          >
            <Layer
              id="country-borders"
              type="line"
              source-layer="country_boundaries"
              paint={{
                'line-color': '#000000',
                'line-width': 3,
                'line-opacity': 0.8,
              }}
              beforeId="waterway-label"
            />
          </Source>

          {/* Admin boundaries (districts/provinces) */}
          <Layer
            id="admin-boundaries"
            type="line"
            source="composite"
            source-layer="admin"
            filter={['==', ['get', 'admin_level'], 2]}
            paint={{
              'line-color': '#333333',
              'line-width': 2,
              'line-opacity': 0.6,
              'line-dasharray': [2, 2],
            }}
          />
        </Map>
      </div>
    </ErrorBoundary>
  );
}

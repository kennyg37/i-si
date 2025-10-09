'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { MapRef, Source, Layer } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'react-map-gl/mapbox';
import { RWANDA_CENTER, RWANDA_BOUNDS, getRwandaZoomLevel } from '@/lib/utils/geo-utils';
import { ErrorBoundary } from '@/components/error-boundary';
import { useMapStore } from '@/lib/store/map-store';
import type { Coordinates, MapClickEvent } from '@/types';
import { MapPin, X, Locate, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { sentinelHubAPI } from '@/lib/api/sentinel-hub';
import { NasaGibsClient } from '@/lib/api/nasa-gibs';
import { useGeolocation } from '@/hooks/use-geolocation';
import { LocationAnalyticsPanel } from '@/components/location-analytics-panel';
import { ClimateRiskPopup } from '@/components/ClimateRiskPopup';

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
  const [isMapReady, setIsMapReady] = useState(false);

  // Geolocation hook
  const { coordinates: geoCoordinates, isLoading: isGeoLoading, error: geoError, getLocation } = useGeolocation();

  // Track current zoom level for layer visibility management
  const [currentZoom, setCurrentZoom] = useState<number>(getRwandaZoomLevel());

  // Layer max zoom levels
  const SENTINEL_MAX_ZOOM = 13; // Sentinel-2 layers
  const VIIRS_MAX_ZOOM = 10; // VIIRS flood detection
  const MODIS_MAX_ZOOM = 8; // MODIS flood detection
  const NASA_GIBS_MAX_ZOOM = 10; // NASA GIBS layers

  // NASA GIBS client instance
  const nasaGibsClient = new NasaGibsClient();

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
    setIsMapReady(true);
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
        zoom: 12,
        duration: 1500,
        essential: true,
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
    if (!mapRef.current || !isMapReady) return;

    const map = mapRef.current.getMap();
    const center = map.getCenter();
    const zoom = map.getZoom();

    // Update current zoom level
    setCurrentZoom(zoom);

    // Update viewport with the new values
    setViewport({
      latitude: center.lat,
      longitude: center.lng,
      zoom,
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    });
  }, [isMapReady, setViewport]);

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

  // Calculate layer visibility
  const isLayerVisible = useCallback((layerId: string) => {
    const isSelected = selectedLayers.includes(layerId);
    
    // Check zoom level limits for different layer types
    let isWithinZoomLimit = true;
    if (layerId === 'ndvi' || layerId === 'moisture-index' || layerId === 'false-color' || layerId === 'ndwi') {
      isWithinZoomLimit = currentZoom <= SENTINEL_MAX_ZOOM;
    } else if (layerId === 'viirs-flood') {
      isWithinZoomLimit = currentZoom <= VIIRS_MAX_ZOOM;
    } else if (layerId === 'modis-flood') {
      isWithinZoomLimit = currentZoom <= MODIS_MAX_ZOOM;
    } else if (layerId === 'nasa-viirs-flood' || layerId === 'nasa-modis-flood' || 
               layerId === 'nasa-soil-moisture' || layerId === 'nasa-land-temp' || 
               layerId === 'nasa-ndvi' || layerId === 'nasa-rainfall-anomaly') {
      isWithinZoomLimit = currentZoom <= NASA_GIBS_MAX_ZOOM;
    }

    return isSelected && isWithinZoomLimit;
  }, [selectedLayers, currentZoom, SENTINEL_MAX_ZOOM, VIIRS_MAX_ZOOM, MODIS_MAX_ZOOM, NASA_GIBS_MAX_ZOOM]);

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

        {/* Zoom level warnings for layers */}
        {selectedLayers.some(layer => 
          (layer === 'ndvi' && currentZoom > SENTINEL_MAX_ZOOM) ||
          (layer === 'moisture-index' && currentZoom > SENTINEL_MAX_ZOOM) ||
          (layer === 'false-color' && currentZoom > SENTINEL_MAX_ZOOM) ||
          (layer === 'ndwi' && currentZoom > SENTINEL_MAX_ZOOM) ||
          (layer === 'viirs-flood' && currentZoom > VIIRS_MAX_ZOOM) ||
          (layer === 'modis-flood' && currentZoom > MODIS_MAX_ZOOM) ||
          (layer === 'nasa-viirs-flood' && currentZoom > NASA_GIBS_MAX_ZOOM) ||
          (layer === 'nasa-modis-flood' && currentZoom > NASA_GIBS_MAX_ZOOM) ||
          (layer === 'nasa-soil-moisture' && currentZoom > NASA_GIBS_MAX_ZOOM) ||
          (layer === 'nasa-land-temp' && currentZoom > NASA_GIBS_MAX_ZOOM) ||
          (layer === 'nasa-ndvi' && currentZoom > NASA_GIBS_MAX_ZOOM) ||
          (layer === 'nasa-rainfall-anomaly' && currentZoom > NASA_GIBS_MAX_ZOOM)
        ) && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-amber-500/95 backdrop-blur-sm border border-amber-600 rounded-lg p-3 shadow-lg max-w-md">
            <div className="flex items-center gap-2 text-sm text-amber-950">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                Some layers hidden - zoom out to see data
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

        {/* Climate Risk Popup */}
        {showPopup && popupCoordinates && (
          <ClimateRiskPopup
            coordinates={popupCoordinates}
            onClose={handleClosePopup}
            timeRange={timeRange}
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
          minZoom={6}
          maxZoom={18}
          style={{ width: '100%', height: '100%' }}
          mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
          onLoad={handleMapLoad}
          onClick={onMapClick}
          onMoveEnd={handleMove}
          cursor="crosshair"
          attributionControl={false}
          preserveDrawingBuffer={true}
          reuseMaps={true}
        >
          {/* Always render sources, control visibility via paint properties */}

          {/* NDVI Layer - Sentinel Hub */}
          {sentinelHubAPI.isConfigured() && sentinelHubAPI.getNDVITileURL() && (
            <Source
              key="ndvi-source"
              id="ndvi"
              type="raster"
              tiles={[sentinelHubAPI.getNDVITileURL()]}
              tileSize={256}
              scheme="xyz"
            >
              <Layer
                id="ndvi-layer"
                type="raster"
                paint={{
                  'raster-opacity': isLayerVisible('ndvi') ? 0.7 : 0,
                }}
              />
            </Source>
          )}

          {/* NDVI Placeholder when Sentinel Hub not configured */}
          {(!sentinelHubAPI.isConfigured() || !sentinelHubAPI.getNDVITileURL()) && (
            <Source
              key="ndvi-placeholder-source"
              id="ndvi-placeholder"
              type="raster"
              tiles={[`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`]}
              tileSize={256}
            >
              <Layer
                id="ndvi-placeholder-layer"
                type="raster"
                paint={{
                  'raster-opacity': isLayerVisible('ndvi') ? 0.6 : 0,
                  'raster-saturation': 0.3,
                }}
              />
            </Source>
          )}

          {/* Moisture Index Layer - Sentinel Hub */}
          {sentinelHubAPI.isConfigured() && sentinelHubAPI.getMoistureIndexTileURL() && (
            <Source
              key="moisture-index-source"
              id="moisture-index"
              type="raster"
              tiles={[sentinelHubAPI.getMoistureIndexTileURL()]}
              tileSize={256}
              scheme="xyz"
            >
              <Layer
                id="moisture-index-layer"
                type="raster"
                paint={{
                  'raster-opacity': isLayerVisible('moisture-index') ? 0.7 : 0,
                }}
              />
            </Source>
          )}

          {/* False Color Agriculture Layer - Sentinel Hub */}
          {sentinelHubAPI.isConfigured() && sentinelHubAPI.getFalseColorTileURL() && (
            <Source
              key="false-color-source"
              id="false-color"
              type="raster"
              tiles={[sentinelHubAPI.getFalseColorTileURL()]}
              tileSize={256}
              scheme="xyz"
            >
              <Layer
                id="false-color-layer"
                type="raster"
                paint={{
                  'raster-opacity': isLayerVisible('false-color') ? 0.7 : 0,
                }}
              />
            </Source>
          )}

          {/* NDWI Water Detection Layer - Sentinel Hub */}
          {sentinelHubAPI.isConfigured() && sentinelHubAPI.getNDWITileURL() && (
            <Source
              key="ndwi-source"
              id="ndwi"
              type="raster"
              tiles={[sentinelHubAPI.getNDWITileURL()]}
              tileSize={256}
              scheme="xyz"
            >
              <Layer
                id="ndwi-layer"
                type="raster"
                paint={{
                  'raster-opacity': isLayerVisible('ndwi') ? 0.7 : 0,
                }}
              />
            </Source>
          )}

          {/* NASA GIBS Layers */}
          
          {/* VIIRS Flood Detection Layer - NASA GIBS */}
          <Source
            key="nasa-viirs-flood-source"
            id="nasa-viirs-flood"
            type="raster"
            tiles={[nasaGibsClient.getFloodTileURL('viirs_3day')]}
            tileSize={256}
            scheme="xyz"
          >
            <Layer
              id="nasa-viirs-flood-layer"
              type="raster"
              paint={{
                'raster-opacity': isLayerVisible('nasa-viirs-flood') ? 0.8 : 0,
              }}
            />
          </Source>

          {/* MODIS Flood Detection Layer - NASA GIBS */}
          <Source
            key="nasa-modis-flood-source"
            id="nasa-modis-flood"
            type="raster"
            tiles={[nasaGibsClient.getFloodTileURL('modis_3day')]}
            tileSize={256}
            scheme="xyz"
          >
            <Layer
              id="nasa-modis-flood-layer"
              type="raster"
              paint={{
                'raster-opacity': isLayerVisible('nasa-modis-flood') ? 0.8 : 0,
              }}
            />
          </Source>

          {/* Soil Moisture Layer - NASA GIBS */}
          <Source
            key="nasa-soil-moisture-source"
            id="nasa-soil-moisture"
            type="raster"
            tiles={[nasaGibsClient.getSoilMoistureTileURL()]}
            tileSize={256}
            scheme="xyz"
          >
            <Layer
              id="nasa-soil-moisture-layer"
              type="raster"
              paint={{
                'raster-opacity': isLayerVisible('nasa-soil-moisture') ? 0.7 : 0,
              }}
            />
          </Source>

          {/* Land Surface Temperature Layer - NASA GIBS */}
          <Source
            key="nasa-land-temp-source"
            id="nasa-land-temp"
            type="raster"
            tiles={[nasaGibsClient.getLandTempTileURL()]}
            tileSize={256}
            scheme="xyz"
          >
            <Layer
              id="nasa-land-temp-layer"
              type="raster"
              paint={{
                'raster-opacity': isLayerVisible('nasa-land-temp') ? 0.7 : 0,
              }}
            />
          </Source>

          {/* NDVI Vegetation Layer - NASA GIBS */}
          <Source
            key="nasa-ndvi-source"
            id="nasa-ndvi"
            type="raster"
            tiles={[nasaGibsClient.getNDVITileURL()]}
            tileSize={256}
            scheme="xyz"
          >
            <Layer
              id="nasa-ndvi-layer"
              type="raster"
              paint={{
                'raster-opacity': isLayerVisible('nasa-ndvi') ? 0.7 : 0,
              }}
            />
          </Source>

          {/* Rainfall Anomaly Layer - NASA GIBS */}
          <Source
            key="nasa-rainfall-anomaly-source"
            id="nasa-rainfall-anomaly"
            type="raster"
            tiles={[nasaGibsClient.getRainfallAnomalyTileURL()]}
            tileSize={256}
            scheme="xyz"
          >
            <Layer
              id="nasa-rainfall-anomaly-layer"
              type="raster"
              paint={{
                'raster-opacity': isLayerVisible('nasa-rainfall-anomaly') ? 0.7 : 0,
              }}
            />
          </Source>

          {/* Bold country borders layer */}
          <Source
            key="country-boundaries-source"
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

          {/* Admin boundaries */}
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

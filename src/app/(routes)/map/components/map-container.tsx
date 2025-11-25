'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { MapRef, Source, Layer } from 'react-map-gl/mapbox';
import type { MapMouseEvent } from 'react-map-gl/mapbox';
import { RWANDA_CENTER, RWANDA_BOUNDS, getRwandaZoomLevel } from '@/lib/utils/geo-utils';
import { ErrorBoundary } from '@/components/error-boundary';
import { useMapStore } from '@/lib/store/map-store';
import type { Coordinates } from '@/types';
import { X, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { sentinelHubAPI } from '@/lib/api/sentinel-hub';
import { gibsClient, GibsLayerKey, GIBS_DATASETS } from '@/lib/api/nasa-gibs';
import { useGeolocation } from '@/hooks/use-geolocation';
import { LocationAnalyticsPanel } from '@/components/location-analytics-panel';
import { LayerLegend } from './layer-legend';

interface MapContainerProps {
  selectedLayers: string[];
  timeRange: string;
  mapStyle: string;
}

export function MapContainer({ selectedLayers, timeRange, mapStyle }: MapContainerProps) {
  const mapRef = useRef<MapRef>(null);
  
  // State
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsCoordinates, setAnalyticsCoordinates] = useState<Coordinates | null>(null);
  const [mapboxToken] = useState(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  
  // Geolocation
  const { coordinates: geoCoordinates, isLoading: isGeoLoading, error: geoError, getLocation } = useGeolocation();

  // Zustand
  const {
    selectedLocation,
    setMapLoaded,
    handleMapClick,
    setViewport,
    setSelectedLocation,
    clearMarkers
  } = useMapStore();

  // Handlers
  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    mapRef.current?.getMap().resize();
  }, [setMapLoaded]);

  const onMapClick = useCallback((event: MapMouseEvent) => {
    const { lngLat } = event;
    const coordinates: Coordinates = { lat: lngLat.lat, lon: lngLat.lng };
    
    handleMapClick({
      coordinates,
      timestamp: new Date(),
      features: event.features,
    });

    setAnalyticsCoordinates(coordinates);
    setShowAnalytics(true);
    
    mapRef.current?.flyTo({
      center: [lngLat.lng, lngLat.lat],
      zoom: 12,
      duration: 1500,
      essential: true,
    });

    toast.success(`Location selected`, { icon: '📍', duration: 2000 });
  }, [handleMapClick]);

  const handleMove = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const { lat, lng } = map.getCenter();
    setViewport({
      latitude: lat,
      longitude: lng,
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    });
  }, [setViewport]);

  const handleClearSelection = useCallback(() => {
    setSelectedLocation(null);
    setShowAnalytics(false);
    setAnalyticsCoordinates(null);
    clearMarkers();
  }, [setSelectedLocation, clearMarkers]);

  const handlePinMe = useCallback(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (geoCoordinates && !geoError) {
      mapRef.current?.flyTo({
        center: [geoCoordinates.lon, geoCoordinates.lat],
        zoom: 13,
        duration: 2000,
      });
      setAnalyticsCoordinates(geoCoordinates);
      setShowAnalytics(true);
    }
  }, [geoCoordinates, geoError]);

  if (!mapboxToken) return <div className="p-10 text-center">Missing Mapbox Token</div>;

  /**
   * Helper to render GIBS layers.
   * Automatically handles the difference between Raster (Images) and Vector (MVT/Points).
   */
  const renderGibsLayer = (layerKey: GibsLayerKey) => {
    // Optimization: Only render if selected to save resources
    if (!selectedLayers.includes(layerKey)) return null;

    const url = gibsClient.getTileUrl(layerKey);
    const maxZoom = gibsClient.getMaxZoom(layerKey);
    const isVector = gibsClient.isVector(layerKey); // Check if it's a Fire layer (MVT)
    
    // Visual style
    const isVisual = layerKey.includes('flood') || layerKey.includes('fire');
    const opacity = 0.8; // Standard opacity for active layers

    // --- RENDER STRATEGY 1: VECTOR TILES (Fire) ---
    if (isVector) {
      return (
        <Source
          key={layerKey}
          id={`nasa-${layerKey}`}
          type="vector"
          tiles={[url]}
          maxzoom={maxZoom}
        >
          <Layer
            id={`nasa-${layerKey}-layer`}
            type="circle"
            // For GIBS MVT, the internal source-layer name matches the Layer ID
            source-layer={GIBS_DATASETS[layerKey].id} 
            beforeId="waterway-label"
            paint={{
              'circle-color': '#ff3300', // Hot Orange/Red for Fire
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                5, 2,
                10, 4,
                15, 8
              ],
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': opacity
            }}
          />
        </Source>
      );
    }

    // --- RENDER STRATEGY 2: RASTER TILES (Flood, Temp, Soil, etc.) ---
    return (
      <Source
        key={layerKey}
        id={`nasa-${layerKey}`}
        type="raster"
        tiles={[url]}
        tileSize={256}
        maxzoom={maxZoom}
      >
        <Layer
          id={`nasa-${layerKey}-layer`}
          type="raster"
          beforeId="waterway-label"
          paint={{ 
            'raster-opacity': opacity,
            'raster-fade-duration': 300
          }}
        />
      </Source>
    );
  };

  return (
    <ErrorBoundary>
      <div className="w-full h-full relative">
        {/* UI Controls */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          <Button variant="default" size="sm" onClick={handlePinMe} disabled={isGeoLoading} className="shadow-lg">
            <Locate className={`h-4 w-4 mr-2 ${isGeoLoading ? 'animate-spin' : ''}`} />
            {isGeoLoading ? 'Locating...' : 'Pin Me'}
          </Button>
          {(selectedLocation || showAnalytics) && (
            <Button variant="secondary" size="sm" onClick={handleClearSelection} className="shadow-lg">
              <X className="h-4 w-4 mr-2" /> Clear
            </Button>
          )}
        </div>

        {showAnalytics && analyticsCoordinates && (
          <LocationAnalyticsPanel
            lat={analyticsCoordinates.lat}
            lon={analyticsCoordinates.lon}
            onClose={() => setShowAnalytics(false)}
          />
        )}

        {/* Layer Legends */}
        <LayerLegend selectedLayers={selectedLayers} />

        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: RWANDA_CENTER.lon,
            latitude: RWANDA_CENTER.lat,
            zoom: getRwandaZoomLevel(),
          }}
          minZoom={2}
          maxZoom={22}
          style={{ width: '100%', height: '100%' }}
          mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
          onLoad={handleMapLoad}
          onClick={onMapClick}
          onMoveEnd={handleMove}
          attributionControl={false}
          reuseMaps={true}
        >
            {/* --- NASA GIBS LAYERS --- */}
            {/* Visuals */}
            {renderGibsLayer('nasa-viirs-flood')}
            {renderGibsLayer('nasa-flood-risk')}
            {renderGibsLayer('nasa-fire')}
            {renderGibsLayer('nasa-ndvi')}

            {/* Scientific Data (Safe Mode: Level 6/7) */}
            {renderGibsLayer('nasa-soil-moisture')}
            {renderGibsLayer('nasa-land-temp')}
            {renderGibsLayer('nasa-rainfall-anomaly')}

            {/* --- SENTINEL HUB LAYERS (Higher Res) --- */}
            {sentinelHubAPI.isConfigured() && sentinelHubAPI.getNDVITileURL() && (
                <Source id="sentinel-ndvi" type="raster" tiles={[sentinelHubAPI.getNDVITileURL()]} tileSize={256} maxzoom={14}>
                    <Layer 
                        id="sentinel-ndvi-layer" 
                        type="raster" 
                        beforeId="waterway-label"
                        paint={{ 'raster-opacity': selectedLayers.includes('ndvi') ? 0.7 : 0 }} 
                    />
                </Source>
            )}

            {/* --- BASE BOUNDARIES --- */}
            <Source id="country-boundaries" type="vector" url="mapbox://mapbox.country-boundaries-v1">
            <Layer
                id="country-borders"
                type="line"
                source-layer="country_boundaries"
                paint={{
                'line-color': '#000000',
                'line-width': 2,
                'line-opacity': 0.8,
                }}
                beforeId="waterway-label"
            />
            </Source>
        </Map>
      </div>
    </ErrorBoundary>
  );
}
/**
 * MapLayers Component
 * 
 * Reusable component for rendering climate risk layers on Mapbox maps.
 * Handles three main layer types:
 * 1. Flood Risk Layer
 * 2. Drought Risk Layer  
 * 3. Flood Prediction Layer
 * 
 * Features:
 * - Semi-transparent raster layers (opacity: 0.6)
 * - Dynamic styling based on risk levels
 * - Loading states and error handling
 * - Optimized rendering with proper data sources
 */

import React from 'react';
import { Source, Layer } from 'react-map-gl/mapbox';
import type { FeatureCollection, Feature, Geometry } from 'geojson';

// Type definitions for layer data
export interface RiskLayerData extends FeatureCollection {
  features: Array<Feature<Geometry, {
    risk: 'low' | 'moderate' | 'high' | 'extreme' | 'severe' | 'mild' | 'none';
    score: number;
    [key: string]: any;
  }>>;
}

export interface MapLayersProps {
  // Layer visibility controls
  showFloodRisk: boolean;
  showDroughtRisk: boolean;
  showFloodPrediction: boolean;
  
  // Layer data
  floodRiskData?: RiskLayerData;
  droughtRiskData?: RiskLayerData;
  floodPredictionData?: RiskLayerData;
  
  // Loading states
  isLoadingFloodRisk?: boolean;
  isLoadingDroughtRisk?: boolean;
  isLoadingFloodPrediction?: boolean;
  
  // Error states
  floodRiskError?: string | null;
  droughtRiskError?: string | null;
  floodPredictionError?: string | null;
  
  // Styling options
  opacity?: number;
  showLabels?: boolean;
}

/**
 * Color schemes for different risk types
 */
const RISK_COLORS = {
  flood: {
    extreme: '#8B0000', // Dark red
    high: '#FF0000',    // Red
    moderate: '#FFA500', // Orange
    low: '#FFFF00',     // Yellow
    default: '#90EE90'  // Light green
  },
  drought: {
    extreme: '#8B0000', // Dark red
    severe: '#FF4500',  // Orange red
    moderate: '#FFA500', // Orange
    mild: '#FFFF00',    // Yellow
    none: '#90EE90',    // Light green
    default: '#90EE90'
  },
  prediction: {
    extreme: '#8B0000', // Dark red
    high: '#FF0000',    // Red
    moderate: '#FFA500', // Orange
    low: '#FFFF00',     // Yellow
    default: '#90EE90'  // Light green
  }
};

/**
 * Get color for risk level and type
 */
function getRiskColor(risk: string, type: 'flood' | 'drought' | 'prediction'): string {
  const colorMap = RISK_COLORS[type];
  return colorMap[risk as keyof typeof colorMap] || colorMap.default;
}

/**
 * Generate paint properties for risk layers
 */
function getRiskLayerPaint(
  riskType: 'flood' | 'drought' | 'prediction',
  opacity: number = 0.6,
  showLabels: boolean = false
) {
  return {
    'fill-color': [
      'match',
      ['get', 'risk'],
      'extreme', getRiskColor('extreme', riskType),
      'severe', getRiskColor('severe', riskType),
      'high', getRiskColor('high', riskType),
      'moderate', getRiskColor('moderate', riskType),
      'mild', getRiskColor('mild', riskType),
      'low', getRiskColor('low', riskType),
      'none', getRiskColor('none', riskType),
      getRiskColor('default', riskType)
    ],
    'fill-opacity': [
      'interpolate',
      ['linear'],
      ['get', 'score'],
      0, opacity * 0.3,
      0.5, opacity * 0.6,
      1, opacity
    ],
    'fill-outline-color': [
      'match',
      ['get', 'risk'],
      'extreme', '#8B0000',
      'severe', '#FF4500',
      'high', '#FF0000',
      'moderate', '#FFA500',
      'mild', '#FFFF00',
      'low', '#FFFF00',
      'none', '#90EE90',
      '#90EE90'
    ]
  };
}

/**
 * Generate line paint properties for outlines
 */
function getOutlinePaint(riskType: 'flood' | 'drought' | 'prediction') {
  return {
    'line-color': [
      'match',
      ['get', 'risk'],
      'extreme', '#8B0000',
      'severe', '#FF4500',
      'high', '#FF0000',
      'moderate', '#FFA500',
      'mild', '#FFFF00',
      'low', '#FFD700',
      'none', '#98FB98',
      '#98FB98'
    ],
    'line-width': 2,
    'line-opacity': 0.8
  };
}

/**
 * Generate symbol paint properties for labels
 */
function getLabelPaint() {
  return {
    'text-color': '#000000',
    'text-halo-color': '#FFFFFF',
    'text-halo-width': 2,
    'text-size': 12,
    'text-opacity': 0.8
  };
}

export function MapLayers({
  showFloodRisk,
  showDroughtRisk,
  showFloodPrediction,
  floodRiskData,
  droughtRiskData,
  floodPredictionData,
  isLoadingFloodRisk = false,
  isLoadingDroughtRisk = false,
  isLoadingFloodPrediction = false,
  floodRiskError = null,
  droughtRiskError = null,
  floodPredictionError = null,
  opacity = 0.6,
  showLabels = false
}: MapLayersProps) {
  
  return (
    <>
      {/* Flood Risk Layer */}
      {showFloodRisk && floodRiskData && (
        <Source
          key="flood-risk-source"
          id="flood-risk"
          type="geojson"
          data={floodRiskData}
        >
          {/* Main fill layer */}
          <Layer
            id="flood-risk-layer"
            type="fill"
            paint={getRiskLayerPaint('flood', opacity, showLabels) as any}
          />

          {/* Outline layer */}
          <Layer
            id="flood-risk-outline"
            type="line"
            paint={getOutlinePaint('flood') as any}
          />
          
          {/* Labels layer (optional) */}
          {showLabels && (
            <Layer
              id="flood-risk-labels"
              type="symbol"
              layout={{
                'text-field': ['get', 'risk'],
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-size': 12,
                'text-anchor': 'center',
                'text-allow-overlap': false
              }}
              paint={getLabelPaint()}
            />
          )}
        </Source>
      )}

      {/* Drought Risk Layer */}
      {showDroughtRisk && droughtRiskData && (
        <Source
          key="drought-risk-source"
          id="drought-risk"
          type="geojson"
          data={droughtRiskData}
        >
          {/* Main fill layer */}
          <Layer
            id="drought-risk-layer"
            type="fill"
            paint={getRiskLayerPaint('drought', opacity, showLabels) as any}
          />

          {/* Outline layer */}
          <Layer
            id="drought-risk-outline"
            type="line"
            paint={getOutlinePaint('drought') as any}
          />
          
          {/* Labels layer (optional) */}
          {showLabels && (
            <Layer
              id="drought-risk-labels"
              type="symbol"
              layout={{
                'text-field': ['get', 'risk'],
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-size': 12,
                'text-anchor': 'center',
                'text-allow-overlap': false
              }}
              paint={getLabelPaint()}
            />
          )}
        </Source>
      )}

      {/* Flood Prediction Layer */}
      {showFloodPrediction && floodPredictionData && (
        <Source
          key="flood-prediction-source"
          id="flood-prediction"
          type="geojson"
          data={floodPredictionData}
        >
          {/* Main fill layer */}
          <Layer
            id="flood-prediction-layer"
            type="fill"
            paint={getRiskLayerPaint('prediction', opacity, showLabels) as any}
          />

          {/* Outline layer */}
          <Layer
            id="flood-prediction-outline"
            type="line"
            paint={getOutlinePaint('prediction') as any}
          />
          
          {/* Labels layer (optional) */}
          {showLabels && (
            <Layer
              id="flood-prediction-labels"
              type="symbol"
              layout={{
                'text-field': ['get', 'risk'],
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-size': 12,
                'text-anchor': 'center',
                'text-allow-overlap': false
              }}
              paint={getLabelPaint()}
            />
          )}
        </Source>
      )}

      {/* Loading Indicators */}
      {(isLoadingFloodRisk || isLoadingDroughtRisk || isLoadingFloodPrediction) && (
        <div className="absolute top-20 left-4 z-10 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm">
              {isLoadingFloodRisk && 'Loading flood risk...'}
              {isLoadingDroughtRisk && 'Loading drought risk...'}
              {isLoadingFloodPrediction && 'Loading flood prediction...'}
            </span>
          </div>
        </div>
      )}

      {/* Error Indicators */}
      {(floodRiskError || droughtRiskError || floodPredictionError) && (
        <div className="absolute top-20 right-4 z-10 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 text-red-500">⚠️</div>
            <span className="text-sm text-red-700">
              {floodRiskError && 'Flood risk data error'}
              {droughtRiskError && 'Drought risk data error'}
              {floodPredictionError && 'Flood prediction data error'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Utility function to convert risk data to GeoJSON format
 */
export function convertToGeoJSON(
  data: Array<{
    lat: number;
    lon: number;
    risk: string;
    score: number;
    [key: string]: any;
  }>,
  type: 'Point' | 'Polygon' = 'Point'
): RiskLayerData {
  return {
    type: 'FeatureCollection',
    features: data.map((item, index) => {
      const { lat, lon, risk, score, ...rest } = item;

      if (type === 'Point') {
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [lon, lat]
          },
          properties: {
            ...rest,
            risk: risk as 'low' | 'moderate' | 'high' | 'extreme' | 'severe' | 'mild' | 'none',
            score,
            id: index,
            lat,
            lon
          }
        };
      } else {
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[[lon - 0.01, lat - 0.01], [lon + 0.01, lat - 0.01], [lon + 0.01, lat + 0.01], [lon - 0.01, lat + 0.01], [lon - 0.01, lat - 0.01]]]
          },
          properties: {
            ...rest,
            risk: risk as 'low' | 'moderate' | 'high' | 'extreme' | 'severe' | 'mild' | 'none',
            score,
            id: index,
            lat,
            lon
          }
        };
      }
    })
  };
}

/**
 * Utility function to create grid-based risk data
 */
export function createRiskGrid(
  bbox: [number, number, number, number], // [west, south, east, north]
  gridSize: number,
  riskCalculator: (lat: number, lon: number) => Promise<{ risk: string; score: number }>
): Promise<RiskLayerData> {
  const [west, south, east, north] = bbox;
  const latStep = (north - south) / gridSize;
  const lonStep = (east - west) / gridSize;
  
  const promises: Promise<{ lat: number; lon: number; risk: string; score: number }>[] = [];
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = south + (i * latStep);
      const lon = west + (j * lonStep);
      
      promises.push(
        riskCalculator(lat, lon).then(result => ({
          lat,
          lon,
          ...result
        }))
      );
    }
  }
  
  return Promise.all(promises).then(data => convertToGeoJSON(data, 'Point'));
}

export default MapLayers;
import { useQuery } from '@tanstack/react-query';
import { floodRiskAPI } from '@/lib/api/flood-risk';
import type { FloodRiskData } from '@/lib/api/flood-risk';

/**
 * Hook to fetch flood risk data for a specific location
 */
export function useFloodRisk(
  lat: number,
  lon: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['flood-risk', lat, lon],
    queryFn: () => floodRiskAPI.calculateFloodRisk(lat, lon),
    enabled: enabled && !!lat && !!lon,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}

/**
 * Hook to generate flood risk grid for a bounding box
 * This creates a heatmap of flood risk across an area
 */
export function useFloodRiskGrid(
  bbox: [number, number, number, number] | null,
  gridSize: number = 5,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['flood-risk-grid', bbox, gridSize],
    queryFn: async () => {
      if (!bbox) return [];
      return floodRiskAPI.generateFloodRiskGrid(bbox, gridSize);
    },
    enabled: enabled && !!bbox,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
}

/**
 * Convert flood risk data to GeoJSON features
 */
export function floodRiskToGeoJSON(riskData: FloodRiskData[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = riskData.map((risk, index) => {
    // Create a small polygon around each point (approximately 0.1 degree radius)
    const lat = risk.coordinates.lat;
    const lon = risk.coordinates.lon;
    const offset = 0.05; // ~5.5km at equator

    return {
      type: 'Feature',
      properties: {
        risk: risk.riskLevel,
        score: risk.riskScore,
        rainfall: risk.factors.rainfall.recent.toFixed(1),
        elevation: Math.round(risk.factors.elevation.value),
        slope: risk.factors.slope.value.toFixed(1),
        rainfallAnomaly: (risk.factors.rainfall.anomaly * 100).toFixed(0),
        name: `${risk.riskLevel.toUpperCase()} Risk Zone`,
        updated: risk.timestamp.toISOString().split('T')[0],
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lon - offset, lat - offset],
          [lon + offset, lat - offset],
          [lon + offset, lat + offset],
          [lon - offset, lat + offset],
          [lon - offset, lat - offset],
        ]],
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * React hooks for risk indices
 *
 * Provides easy-to-use hooks for fetching and managing:
 * - Flood Risk Index
 * - Drought Risk Index
 * - Flood Prediction Score
 *
 * All hooks use React Query for caching, automatic refetching, and loading states
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  calculateFloodRisk,
  FloodRiskInput,
  FloodRiskResult
} from '../data/flood-risk-index';
import {
  calculateDroughtRisk,
  DroughtRiskInput,
  DroughtRiskResult
} from '../data/drought-risk-index';
import {
  calculateFloodPrediction,
  FloodPredictionInput,
  FloodPredictionResult
} from '../data/flood-prediction';

/**
 * Hook for Flood Risk Index
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useFloodRisk({
 *   latitude: -1.9403,
 *   longitude: 29.8739,
 *   startDate: '20240101',
 *   endDate: '20240107'
 * });
 * ```
 */
export function useFloodRisk(
  input: FloodRiskInput | null,
  enabled: boolean = true
): UseQueryResult<FloodRiskResult, Error> {
  return useQuery({
    queryKey: ['flood-risk', input?.latitude, input?.longitude, input?.startDate, input?.endDate],
    queryFn: async () => {
      if (!input) {
        throw new Error('Flood risk input is required');
      }
      return await calculateFloodRisk(input);
    },
    enabled: enabled && !!input && !!input.latitude && !!input.longitude && !!input.startDate && !!input.endDate,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2,
    refetchOnWindowFocus: false
  });
}

/**
 * Hook for Drought Risk Index
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useDroughtRisk({
 *   latitude: -1.9403,
 *   longitude: 29.8739,
 *   startDate: '20240101',
 *   endDate: '20240131'
 * });
 * ```
 */
export function useDroughtRisk(
  input: DroughtRiskInput | null,
  enabled: boolean = true
): UseQueryResult<DroughtRiskResult, Error> {
  return useQuery({
    queryKey: ['drought-risk', input?.latitude, input?.longitude, input?.startDate, input?.endDate],
    queryFn: async () => {
      if (!input) {
        throw new Error('Drought risk input is required');
      }
      return await calculateDroughtRisk(input);
    },
    enabled: enabled && !!input && !!input.latitude && !!input.longitude && !!input.startDate && !!input.endDate,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 2,
    refetchOnWindowFocus: false
  });
}

/**
 * Hook for Flood Prediction Score
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error } = useFloodPrediction({
 *   latitude: -1.9403,
 *   longitude: 29.8739
 * });
 * ```
 */
export function useFloodPrediction(
  input: FloodPredictionInput | null,
  enabled: boolean = true
): UseQueryResult<FloodPredictionResult, Error> {
  return useQuery({
    queryKey: ['flood-prediction', input?.latitude, input?.longitude],
    queryFn: async () => {
      if (!input) {
        throw new Error('Flood prediction input is required');
      }
      return await calculateFloodPrediction(input);
    },
    enabled: enabled && !!input && !!input.latitude && !!input.longitude,
    staleTime: 1000 * 60 * 15, // 15 minutes (more frequent for predictions)
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    refetchOnWindowFocus: true // Refetch predictions when user returns
  });
}

/**
 * Hook for combined risk assessment (all three indices)
 *
 * Usage:
 * ```tsx
 * const { floodRisk, droughtRisk, floodPrediction } = useCombinedRisk({
 *   latitude: -1.9403,
 *   longitude: 29.8739,
 *   startDate: '20240101',
 *   endDate: '20240107'
 * });
 * ```
 */
export function useCombinedRisk(input: {
  latitude: number;
  longitude: number;
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
} | null, enabled: boolean = true) {
  const floodRisk = useFloodRisk(
    input
      ? {
          latitude: input.latitude,
          longitude: input.longitude,
          startDate: input.startDate,
          endDate: input.endDate
        }
      : null,
    enabled
  );

  const droughtRisk = useDroughtRisk(
    input
      ? {
          latitude: input.latitude,
          longitude: input.longitude,
          startDate: input.startDate,
          endDate: input.endDate
        }
      : null,
    enabled
  );

  const floodPrediction = useFloodPrediction(
    input
      ? {
          latitude: input.latitude,
          longitude: input.longitude
        }
      : null,
    enabled
  );

  return {
    floodRisk,
    droughtRisk,
    floodPrediction,
    isLoading: floodRisk.isLoading || droughtRisk.isLoading || floodPrediction.isLoading,
    isError: floodRisk.isError || droughtRisk.isError || floodPrediction.isError,
    error: floodRisk.error || droughtRisk.error || floodPrediction.error
  };
}

/**
 * Hook for auto-calculated date ranges
 * Automatically calculates appropriate date ranges based on current date
 *
 * Usage:
 * ```tsx
 * const { data, isLoading } = useAutoFloodRisk({
 *   latitude: -1.9403,
 *   longitude: 29.8739,
 *   daysBack: 7 // Optional, defaults to 7 days
 * });
 * ```
 */
export function useAutoFloodRisk(input: {
  latitude: number;
  longitude: number;
  daysBack?: number;
} | null, enabled: boolean = true) {
  const daysBack = input?.daysBack || 7;

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const floodRiskInput = input
    ? {
        latitude: input.latitude,
        longitude: input.longitude,
        startDate: startDate.toISOString().split('T')[0].replace(/-/g, ''),
        endDate: endDate.toISOString().split('T')[0].replace(/-/g, '')
      }
    : null;

  return useFloodRisk(floodRiskInput, enabled);
}

/**
 * Hook for auto-calculated drought risk (typically longer period)
 *
 * Usage:
 * ```tsx
 * const { data, isLoading } = useAutoDroughtRisk({
 *   latitude: -1.9403,
 *   longitude: 29.8739,
 *   daysBack: 30 // Optional, defaults to 30 days
 * });
 * ```
 */
export function useAutoDroughtRisk(input: {
  latitude: number;
  longitude: number;
  daysBack?: number;
} | null, enabled: boolean = true) {
  const daysBack = input?.daysBack || 30;

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const droughtRiskInput = input
    ? {
        latitude: input.latitude,
        longitude: input.longitude,
        startDate: startDate.toISOString().split('T')[0].replace(/-/g, ''),
        endDate: endDate.toISOString().split('T')[0].replace(/-/g, '')
      }
    : null;

  return useDroughtRisk(droughtRiskInput, enabled);
}

/**
 * Hook for grid-based risk calculation (for map visualization)
 * Calculates risk for multiple points in a grid
 *
 * Usage:
 * ```tsx
 * const { data, isLoading } = useGridRisk({
 *   bounds: {
 *     south: -2.5,
 *     north: -1.0,
 *     west: 29.0,
 *     east: 30.5
 *   },
 *   gridSize: 10, // 10x10 grid
 *   riskType: 'flood'
 * });
 * ```
 */
export function useGridRisk(input: {
  bounds: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  gridSize: number;
  riskType: 'flood' | 'drought' | 'prediction';
  startDate?: string;
  endDate?: string;
} | null, enabled: boolean = true) {
  return useQuery({
    queryKey: [
      'grid-risk',
      input?.bounds,
      input?.gridSize,
      input?.riskType,
      input?.startDate,
      input?.endDate
    ],
    queryFn: async () => {
      if (!input) {
        throw new Error('Grid risk input is required');
      }

      const { bounds, gridSize, riskType, startDate, endDate } = input;

      // Calculate grid points
      const latStep = (bounds.north - bounds.south) / gridSize;
      const lonStep = (bounds.east - bounds.west) / gridSize;

      const points: { lat: number; lon: number }[] = [];
      for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize; j++) {
          points.push({
            lat: bounds.south + i * latStep,
            lon: bounds.west + j * lonStep
          });
        }
      }

      // Calculate default date range
      const end = endDate || new Date().toISOString().split('T')[0].replace(/-/g, '');
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '');

      // Calculate risk for each point
      const results = await Promise.all(
        points.map(async (point) => {
          try {
            let risk: number;
            if (riskType === 'flood') {
              const result = await calculateFloodRisk({
                latitude: point.lat,
                longitude: point.lon,
                startDate: start,
                endDate: end
              });
              risk = result.riskScore;
            } else if (riskType === 'drought') {
              const result = await calculateDroughtRisk({
                latitude: point.lat,
                longitude: point.lon,
                startDate: start,
                endDate: end
              });
              risk = result.riskScore;
            } else {
              const result = await calculateFloodPrediction({
                latitude: point.lat,
                longitude: point.lon
              });
              risk = result.overallScore;
            }

            return {
              latitude: point.lat,
              longitude: point.lon,
              risk
            };
          } catch (error) {
            console.error(`Error calculating risk for ${point.lat}, ${point.lon}:`, error);
            return {
              latitude: point.lat,
              longitude: point.lon,
              risk: 0
            };
          }
        })
      );

      return results;
    },
    enabled: enabled && !!input,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 4, // 4 hours
    retry: 1
  });
}

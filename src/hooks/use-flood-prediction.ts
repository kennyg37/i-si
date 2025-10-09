/**
 * useFloodPrediction Hook
 * 
 * Custom React hook for fetching and managing flood prediction data.
 * Uses the flood prediction algorithm to calculate future flood risk
 * based on past rainfall trends and environmental factors.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateFloodPrediction } from '@/lib/data/flood-prediction';
import type { FloodPredictionData, Coordinates, TimeRange } from '@/types/climate-risk';

export interface UseFloodPredictionOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  gcTime?: number;
}

export interface UseFloodPredictionReturn {
  data: FloodPredictionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated?: string;
}

/**
 * Hook for fetching flood prediction data for a single location
 */
export function useFloodPrediction(
  coordinates: Coordinates | null,
  predictionDays: number = 7,
  options: UseFloodPredictionOptions = {}
): UseFloodPredictionReturn {
  const {
    enabled = true,
    refetchInterval = 1000 * 60 * 30, // 30 minutes
    staleTime = 1000 * 60 * 15, // 15 minutes
    gcTime = 1000 * 60 * 60 * 2 // 2 hours
  } = options;

  const query = useQuery({
    queryKey: ['flood-prediction', coordinates?.lat, coordinates?.lon, predictionDays],
    queryFn: async () => {
      if (!coordinates) {
        throw new Error('Coordinates are required');
      }

      return await calculateFloodPrediction({
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        predictionDays
      });
    },
    enabled: enabled && !!coordinates,
    refetchInterval,
    staleTime,
    gcTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  return {
    data: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : undefined
  };
}

/**
 * Hook for fetching flood prediction data for multiple locations (grid)
 */
export function useFloodPredictionGrid(
  bbox: [number, number, number, number], // [west, south, east, north]
  gridSize: number = 8,
  predictionDays: number = 7,
  options: UseFloodPredictionOptions = {}
): UseFloodPredictionReturn {
  const {
    enabled = true,
    refetchInterval = 1000 * 60 * 30, // 30 minutes
    staleTime = 1000 * 60 * 15, // 15 minutes
    gcTime = 1000 * 60 * 60 * 2 // 2 hours
  } = options;

  const query = useQuery({
    queryKey: ['flood-prediction-grid', bbox, gridSize, predictionDays],
    queryFn: async () => {
      const [west, south, east, north] = bbox;
      const latStep = (north - south) / gridSize;
      const lonStep = (east - west) / gridSize;
      
      const predictions: Array<{
        lat: number;
        lon: number;
        prediction: FloodPredictionData;
      }> = [];

      // Calculate predictions for each grid point
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const lat = south + (i * latStep);
          const lon = west + (j * lonStep);

          try {
            const prediction = await calculateFloodPrediction({
              latitude: lat,
              longitude: lon,
              predictionDays
            });

            predictions.push({
              lat,
              lon,
              prediction
            });
          } catch (error) {
            console.warn(`Failed to calculate flood prediction for ${lat}, ${lon}:`, error);
          }
        }
      }

      return predictions;
    },
    enabled: enabled && gridSize > 0,
    refetchInterval,
    staleTime,
    gcTime,
    retry: 1,
    retryDelay: 5000
  });

  return {
    data: query.data as any || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : undefined
  };
}

/**
 * Hook for fetching flood prediction data with time range
 */
export function useFloodPredictionTimeSeries(
  coordinates: Coordinates | null,
  timeRange: TimeRange = '30d',
  predictionDays: number = 7,
  options: UseFloodPredictionOptions = {}
): UseFloodPredictionReturn {
  const {
    enabled = true,
    refetchInterval = 1000 * 60 * 60, // 1 hour
    staleTime = 1000 * 60 * 30, // 30 minutes
    gcTime = 1000 * 60 * 60 * 4 // 4 hours
  } = options;

  const query = useQuery({
    queryKey: ['flood-prediction-timeseries', coordinates?.lat, coordinates?.lon, timeRange, predictionDays],
    queryFn: async () => {
      if (!coordinates) {
        throw new Error('Coordinates are required');
      }

      // Calculate date range based on timeRange
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '5y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
      }

      // For time series, we'll calculate predictions for multiple time points
      const timePoints = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        timePoints.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7); // Weekly intervals
      }

      const predictions = await Promise.all(
        timePoints.map(async (date) => {
          try {
            const prediction = await calculateFloodPrediction({
              latitude: coordinates.lat,
              longitude: coordinates.lon,
              predictionDays
            });
            
            return {
              date: date.toISOString(),
              prediction
            };
          } catch (error) {
            console.warn(`Failed to calculate flood prediction for ${date}:`, error);
            return null;
          }
        })
      );

      return predictions.filter(p => p !== null);
    },
    enabled: enabled && !!coordinates,
    refetchInterval,
    staleTime,
    gcTime,
    retry: 1,
    retryDelay: 10000
  });

  return {
    data: query.data as any || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toISOString() : undefined
  };
}

/**
 * Hook for real-time flood prediction monitoring
 */
export function useFloodPredictionMonitoring(
  coordinates: Coordinates | null,
  options: UseFloodPredictionOptions & {
    alertThreshold?: number; // 0-1 scale
    onAlert?: (prediction: FloodPredictionData) => void;
  } = {}
): UseFloodPredictionReturn & {
  isAlert: boolean;
  alertLevel: 'low' | 'moderate' | 'high' | 'extreme' | null;
} {
  const {
    alertThreshold = 0.7,
    onAlert,
    ...queryOptions
  } = options;

  const predictionQuery = useFloodPrediction(coordinates, 7, {
    ...queryOptions,
    refetchInterval: 1000 * 60 * 5, // 5 minutes for monitoring
    staleTime: 1000 * 60 * 2 // 2 minutes
  });

  const [isAlert, setIsAlert] = useState(false);
  const [alertLevel, setAlertLevel] = useState<'low' | 'moderate' | 'high' | 'extreme' | null>(null);

  // Monitor for alerts
  useEffect(() => {
    if (predictionQuery.data) {
      const { predictionScore, severity } = predictionQuery.data;
      
      if (predictionScore >= alertThreshold) {
        setIsAlert(true);
        setAlertLevel(severity as any);
        
        if (onAlert) {
          onAlert(predictionQuery.data);
        }
      } else {
        setIsAlert(false);
        setAlertLevel(null);
      }
    }
  }, [predictionQuery.data, alertThreshold, onAlert]);

  return {
    ...predictionQuery,
    isAlert,
    alertLevel
  };
}

export default useFloodPrediction;


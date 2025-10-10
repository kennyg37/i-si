/**
 * React hooks for satellite data integration
 */

import { useState, useEffect } from 'react';
import { fetchSatelliteData, SatelliteDataResponse, NDVIData, LandSurfaceTemperature, SoilMoisture, LandUseData } from '@/lib/api/satellite-data';

export interface UseSatelliteDataOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  dataTypes?: ('ndvi' | 'lst' | 'soil' | 'et' | 'landuse')[];
  enabled?: boolean;
}

export interface UseSatelliteDataReturn {
  data: SatelliteDataResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSatelliteData({
  lat,
  lon,
  startDate,
  endDate,
  dataTypes = ['ndvi', 'lst'],
  enabled = true
}: UseSatelliteDataOptions): UseSatelliteDataReturn {
  const [data, setData] = useState<SatelliteDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSatelliteData(lat, lon, startDate, endDate, dataTypes);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch satellite data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, dataTypes.join(','), enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

export interface UseNDVIDataOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export interface UseNDVIDataReturn {
  data: NDVIData[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  vegetationHealth: {
    current: { health: string; score: number } | null;
    trend: 'improving' | 'declining' | 'stable';
    average: number;
  };
}

export function useNDVIData({
  lat,
  lon,
  startDate,
  endDate,
  enabled = true
}: UseNDVIDataOptions): UseNDVIDataReturn {
  const [data, setData] = useState<NDVIData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSatelliteData(lat, lon, startDate, endDate, ['ndvi']);
      setData(result.ndvi);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch NDVI data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, enabled]);

  // Calculate vegetation health metrics
  const vegetationHealth = (() => {
    if (!data || data.length === 0) {
      return {
        current: null,
        trend: 'stable' as const,
        average: 0
      };
    }

    const values = data.map(d => d.value);
    const current = data[data.length - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondAvg > firstAvg + 0.05) trend = 'improving';
    else if (secondAvg < firstAvg - 0.05) trend = 'declining';

    return {
      current: {
        health: current.value >= 0.7 ? 'excellent' : 
                current.value >= 0.5 ? 'good' : 
                current.value >= 0.3 ? 'moderate' : 
                current.value >= 0.1 ? 'poor' : 'critical',
        score: current.value
      },
      trend,
      average
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    vegetationHealth
  };
}

export interface UseLandSurfaceTemperatureOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export interface UseLandSurfaceTemperatureReturn {
  data: LandSurfaceTemperature[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  temperatureAnalysis: {
    current: { day: number; night: number; average: number } | null;
    trend: 'warming' | 'cooling' | 'stable';
    heatIsland: boolean;
    extremes: { max: number; min: number };
  };
}

export function useLandSurfaceTemperature({
  lat,
  lon,
  startDate,
  endDate,
  enabled = true
}: UseLandSurfaceTemperatureOptions): UseLandSurfaceTemperatureReturn {
  const [data, setData] = useState<LandSurfaceTemperature[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSatelliteData(lat, lon, startDate, endDate, ['lst']);
      setData(result.landSurfaceTemp);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch land surface temperature data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, enabled]);

  // Calculate temperature analysis
  const temperatureAnalysis = (() => {
    if (!data || data.length === 0) {
      return {
        current: null,
        trend: 'stable' as const,
        heatIsland: false,
        extremes: { max: 0, min: 0 }
      };
    }

    const current = data[data.length - 1];
    const averages = data.map(d => d.average);
    const dayTemps = data.map(d => d.dayTemp);
    const nightTemps = data.map(d => d.nightTemp);

    // Calculate trend
    const firstHalf = averages.slice(0, Math.floor(averages.length / 2));
    const secondHalf = averages.slice(Math.floor(averages.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'warming' | 'cooling' | 'stable' = 'stable';
    if (secondAvg > firstAvg + 1) trend = 'warming';
    else if (secondAvg < firstAvg - 1) trend = 'cooling';

    // Detect heat island effect (large day-night temperature difference)
    const avgDayNightDiff = data.reduce((sum, d) => sum + (d.dayTemp - d.nightTemp), 0) / data.length;
    const heatIsland = avgDayNightDiff > 15; // >15°C difference suggests heat island

    return {
      current: {
        day: current.dayTemp,
        night: current.nightTemp,
        average: current.average
      },
      trend,
      heatIsland,
      extremes: {
        max: Math.max(...dayTemps),
        min: Math.min(...nightTemps)
      }
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    temperatureAnalysis
  };
}

export interface UseSoilMoistureOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export interface UseSoilMoistureReturn {
  data: SoilMoisture[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  moistureAnalysis: {
    current: { surface: number; rootZone: number } | null;
    trend: 'drying' | 'wetting' | 'stable';
    droughtRisk: 'low' | 'moderate' | 'high' | 'extreme';
    irrigationNeed: number; // 0-1 scale
  };
}

export function useSoilMoisture({
  lat,
  lon,
  startDate,
  endDate,
  enabled = true
}: UseSoilMoistureOptions): UseSoilMoistureReturn {
  const [data, setData] = useState<SoilMoisture[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSatelliteData(lat, lon, startDate, endDate, ['soil']);
      setData(result.soilMoisture);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch soil moisture data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, enabled]);

  // Calculate moisture analysis
  const moistureAnalysis = (() => {
    if (!data || data.length === 0) {
      return {
        current: null,
        trend: 'stable' as const,
        droughtRisk: 'low' as const,
        irrigationNeed: 0
      };
    }

    const current = data[data.length - 1];
    const rootZoneValues = data.map(d => d.rootZone);

    // Calculate trend
    const firstHalf = rootZoneValues.slice(0, Math.floor(rootZoneValues.length / 2));
    const secondHalf = rootZoneValues.slice(Math.floor(rootZoneValues.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'drying' | 'wetting' | 'stable' = 'stable';
    if (secondAvg < firstAvg - 0.1) trend = 'drying';
    else if (secondAvg > firstAvg + 0.1) trend = 'wetting';

    // Determine drought risk
    const avgMoisture = rootZoneValues.reduce((sum, val) => sum + val, 0) / rootZoneValues.length;
    let droughtRisk: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
    if (avgMoisture < 0.2) droughtRisk = 'extreme';
    else if (avgMoisture < 0.3) droughtRisk = 'high';
    else if (avgMoisture < 0.4) droughtRisk = 'moderate';

    // Calculate irrigation need (inverse of soil moisture)
    const irrigationNeed = Math.max(0, 1 - avgMoisture);

    return {
      current: {
        surface: current.surface,
        rootZone: current.rootZone
      },
      trend,
      droughtRisk,
      irrigationNeed
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    moistureAnalysis
  };
}

export interface UseLandUseOptions {
  lat: number;
  lon: number;
  enabled?: boolean;
}

export interface UseLandUseReturn {
  data: LandUseData[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  landUseAnalysis: {
    dominantType: string;
    agriculturalPercentage: number;
    forestPercentage: number;
    urbanizationTrend: 'increasing' | 'decreasing' | 'stable';
    environmentalImpact: 'low' | 'moderate' | 'high';
  };
}

export function useLandUse({
  lat,
  lon,
  enabled = true
}: UseLandUseOptions): UseLandUseReturn {
  const [data, setData] = useState<LandUseData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchSatelliteData(lat, lon, '2024-01-01', '2024-01-01', ['landuse']);
      setData(result.landUse);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch land use data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, enabled]);

  // Calculate land use analysis
  const landUseAnalysis = (() => {
    if (!data || data.length === 0) {
      return {
        dominantType: 'unknown',
        agriculturalPercentage: 0,
        forestPercentage: 0,
        urbanizationTrend: 'stable' as const,
        environmentalImpact: 'low' as const
      };
    }

    const dominantType = data.reduce((max, current) => 
      current.percentage > max.percentage ? current : max
    ).type;

    const agriculturalPercentage = data.find(d => d.type === 'agricultural')?.percentage || 0;
    const forestPercentage = data.find(d => d.type === 'forest')?.percentage || 0;
    const urbanChange = data.find(d => d.type === 'urban')?.change || 0;

    const urbanizationTrend: 'increasing' | 'decreasing' | 'stable' = 
      urbanChange > 2 ? 'increasing' : 
      urbanChange < -2 ? 'decreasing' : 'stable';

    // Calculate environmental impact based on land use composition
    const naturalCover = forestPercentage + (data.find(d => d.type === 'water')?.percentage || 0);
    const environmentalImpact: 'low' | 'moderate' | 'high' = 
      naturalCover > 60 ? 'low' : 
      naturalCover > 30 ? 'moderate' : 'high';

    return {
      dominantType,
      agriculturalPercentage,
      forestPercentage,
      urbanizationTrend,
      environmentalImpact
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    landUseAnalysis
  };
}

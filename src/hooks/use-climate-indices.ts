/**
 * React hooks for climate indices data
 */

import { useState, useEffect } from 'react';
import { 
  fetchClimateIndices, 
  ClimateIndicesResponse, 
  SPIData, 
  SPEIData, 
  HeatIndexData, 
  WindChillData
} from '@/lib/api/climate-indices';

export interface UseClimateIndicesOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  indices?: ('spi' | 'spei' | 'pdsi' | 'heat' | 'windchill')[];
  enabled?: boolean;
}

export interface UseClimateIndicesReturn {
  data: ClimateIndicesResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useClimateIndices({
  lat,
  lon,
  startDate,
  endDate,
  indices = ['spi', 'spei'],
  enabled = true
}: UseClimateIndicesOptions): UseClimateIndicesReturn {
  const [data, setData] = useState<ClimateIndicesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchClimateIndices(lat, lon, startDate, endDate);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch climate indices'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, indices.join(','), enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

export interface UseSPIDataOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  timescale?: 1 | 3 | 6 | 9 | 12 | 24;
  enabled?: boolean;
}

export interface UseSPIDataReturn {
  data: SPIData[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  droughtAnalysis: {
    current: { value: number; category: string; description: string } | null;
    trend: 'worsening' | 'improving' | 'stable';
    severity: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme';
    duration: number; // months
  };
}

export function useSPIData({
  lat,
  lon,
  startDate,
  endDate,
  timescale = 12,
  enabled = true
}: UseSPIDataOptions): UseSPIDataReturn {
  const [data, setData] = useState<SPIData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchClimateIndices(lat, lon, startDate, endDate);
      setData(result.spi);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch SPI data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, timescale, enabled]);

  // Calculate drought analysis
  const droughtAnalysis = (() => {
    if (!data || data.length === 0) {
      return {
        current: null,
        trend: 'stable' as const,
        severity: 'none' as const,
        duration: 0
      };
    }

    const current = data[data.length - 1];
    const values = data.map(d => d.value);

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'worsening' | 'improving' | 'stable' = 'stable';
    if (secondAvg < firstAvg - 0.5) trend = 'worsening';
    else if (secondAvg > firstAvg + 0.5) trend = 'improving';

    // Determine severity
    let severity: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme' = 'none';
    if (current.value <= -2.0) severity = 'extreme';
    else if (current.value <= -1.5) severity = 'severe';
    else if (current.value <= -1.0) severity = 'moderate';
    else if (current.value <= -0.5) severity = 'mild';

    // Calculate drought duration (consecutive negative SPI values)
    let duration = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].value < -0.5) {
        duration++;
      } else {
        break;
      }
    }

    return {
      current: {
        value: current.value,
        category: current.category,
        description: current.description
      },
      trend,
      severity,
      duration
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    droughtAnalysis
  };
}

export interface UseSPEIDataOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  timescale?: 1 | 3 | 6 | 9 | 12 | 24;
  enabled?: boolean;
}

export interface UseSPEIDataReturn {
  data: SPEIData[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  droughtAnalysis: {
    current: { value: number; category: string; description: string } | null;
    trend: 'worsening' | 'improving' | 'stable';
    severity: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme';
    temperatureImpact: boolean;
  };
}

export function useSPEIData({
  lat,
  lon,
  startDate,
  endDate,
  timescale = 12,
  enabled = true
}: UseSPEIDataOptions): UseSPEIDataReturn {
  const [data, setData] = useState<SPEIData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchClimateIndices(lat, lon, startDate, endDate);
      setData(result.spei);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch SPEI data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, timescale, enabled]);

  // Calculate drought analysis
  const droughtAnalysis = (() => {
    if (!data || data.length === 0) {
      return {
        current: null,
        trend: 'stable' as const,
        severity: 'none' as const,
        temperatureImpact: false
      };
    }

    const current = data[data.length - 1];
    const values = data.map(d => d.value);

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'worsening' | 'improving' | 'stable' = 'stable';
    if (secondAvg < firstAvg - 0.5) trend = 'worsening';
    else if (secondAvg > firstAvg + 0.5) trend = 'improving';

    // Determine severity
    let severity: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme' = 'none';
    if (current.value <= -2.0) severity = 'extreme';
    else if (current.value <= -1.5) severity = 'severe';
    else if (current.value <= -1.0) severity = 'moderate';
    else if (current.value <= -0.5) severity = 'mild';

    // Check if temperature is exacerbating drought conditions
    const temperatureImpact = current.value < -1.0 && trend === 'worsening';

    return {
      current: {
        value: current.value,
        category: current.category,
        description: current.description
      },
      trend,
      severity,
      temperatureImpact
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    droughtAnalysis
  };
}

export interface UseHeatIndexOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export interface UseHeatIndexReturn {
  data: HeatIndexData[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  heatAnalysis: {
    current: { value: number; category: string; feelsLike: number } | null;
    trend: 'increasing' | 'decreasing' | 'stable';
    riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
    heatWaveDays: number;
    recommendations: string[];
  };
}

export function useHeatIndex({
  lat,
  lon,
  startDate,
  endDate,
  enabled = true
}: UseHeatIndexOptions): UseHeatIndexReturn {
  const [data, setData] = useState<HeatIndexData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchClimateIndices(lat, lon, startDate, endDate);
      setData(result.heatIndex);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch heat index data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, enabled]);

  // Calculate heat analysis
  const heatAnalysis = (() => {
    if (!data || data.length === 0) {
      return {
        current: null,
        trend: 'stable' as const,
        riskLevel: 'low' as const,
        heatWaveDays: 0,
        recommendations: []
      };
    }

    const current = data[data.length - 1];
    const values = data.map(d => d.value);

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondAvg > firstAvg + 5) trend = 'increasing';
    else if (secondAvg < firstAvg - 5) trend = 'decreasing';

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
    if (current.value >= 130) riskLevel = 'extreme';
    else if (current.value >= 105) riskLevel = 'high';
    else if (current.value >= 90) riskLevel = 'moderate';

    // Count heat wave days (heat index > 90°F)
    const heatWaveDays = data.filter(d => d.value >= 90).length;

    // Generate recommendations based on risk level
    const recommendations: string[] = [];
    if (riskLevel === 'extreme') {
      recommendations.push('Avoid all outdoor activities');
      recommendations.push('Stay in air-conditioned areas');
      recommendations.push('Check on elderly and vulnerable populations');
    } else if (riskLevel === 'high') {
      recommendations.push('Limit outdoor activities to early morning or evening');
      recommendations.push('Stay hydrated and take frequent breaks');
      recommendations.push('Wear lightweight, light-colored clothing');
    } else if (riskLevel === 'moderate') {
      recommendations.push('Take precautions during outdoor activities');
      recommendations.push('Drink plenty of water');
      recommendations.push('Seek shade when possible');
    }

    return {
      current: {
        value: current.value,
        category: current.category,
        feelsLike: current.feelsLike
      },
      trend,
      riskLevel,
      heatWaveDays,
      recommendations
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    heatAnalysis
  };
}

export interface UseWindChillOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export interface UseWindChillReturn {
  data: WindChillData[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  coldAnalysis: {
    current: { value: number; category: string; feelsLike: number } | null;
    trend: 'cooling' | 'warming' | 'stable';
    riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
    frostbiteRisk: boolean;
    recommendations: string[];
  };
}

export function useWindChill({
  lat,
  lon,
  startDate,
  endDate,
  enabled = true
}: UseWindChillOptions): UseWindChillReturn {
  const [data, setData] = useState<WindChillData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchClimateIndices(lat, lon, startDate, endDate);
      setData(result.windChill);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch wind chill data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lat, lon, startDate, endDate, enabled]);

  // Calculate cold analysis
  const coldAnalysis = (() => {
    if (!data || data.length === 0) {
      return {
        current: null,
        trend: 'stable' as const,
        riskLevel: 'low' as const,
        frostbiteRisk: false,
        recommendations: []
      };
    }

    const current = data[data.length - 1];
    const values = data.map(d => d.value);

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'cooling' | 'warming' | 'stable' = 'stable';
    if (secondAvg < firstAvg - 5) trend = 'cooling';
    else if (secondAvg > firstAvg + 5) trend = 'warming';

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'extreme' = 'low';
    if (current.value <= -50) riskLevel = 'extreme';
    else if (current.value <= -30) riskLevel = 'high';
    else if (current.value <= -20) riskLevel = 'moderate';

    // Check frostbite risk
    const frostbiteRisk = current.value <= -20;

    // Generate recommendations based on risk level
    const recommendations: string[] = [];
    if (riskLevel === 'extreme') {
      recommendations.push('Avoid outdoor activities');
      recommendations.push('Frostbite can occur in less than 5 minutes');
      recommendations.push('Stay indoors in heated areas');
    } else if (riskLevel === 'high') {
      recommendations.push('Limit outdoor exposure');
      recommendations.push('Wear multiple layers of clothing');
      recommendations.push('Cover all exposed skin');
    } else if (riskLevel === 'moderate') {
      recommendations.push('Dress warmly for outdoor activities');
      recommendations.push('Take frequent breaks indoors');
      recommendations.push('Watch for signs of frostbite');
    }

    return {
      current: {
        value: current.value,
        category: current.category,
        feelsLike: current.feelsLike
      },
      trend,
      riskLevel,
      frostbiteRisk,
      recommendations
    };
  })();

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    coldAnalysis
  };
}

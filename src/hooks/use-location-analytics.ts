import { useQuery } from '@tanstack/react-query';
import { nasaPowerAPI } from '@/lib/api/nasa-power';
import { useFloodRisk } from './use-flood-risk';
import { useDroughtRisk } from './use-drought-risk';
import { format, subDays } from 'date-fns';

export interface LocationAnalytics {
  coordinates: {
    lat: number;
    lon: number;
  };
  temperature: {
    current: number;
    min: number;
    max: number;
    unit: string;
  };
  rainfall: {
    recent: number; // last 7 days
    monthly: number; // last 30 days
    unit: string;
  };
  floodRisk: {
    score: number;
    level: string;
    details?: any;
  };
  droughtRisk: {
    score: number;
    level: string;
    details?: any;
  };
  timestamp: Date;
  isComplete: boolean;
}

/**
 * Comprehensive hook that fetches and combines all analytics for a location
 * Uses real data from NASA POWER API and custom risk calculations
 */
export function useLocationAnalytics(
  lat: number | null | undefined,
  lon: number | null | undefined,
  enabled: boolean = true
) {
  const isEnabled = enabled && lat !== null && lat !== undefined && lon !== null && lon !== undefined;

  // Fetch flood risk
  const floodRiskQuery = useFloodRisk(
    lat ?? 0,
    lon ?? 0,
    isEnabled
  );

  // Fetch drought risk
  const droughtRiskQuery = useDroughtRisk(
    lat ?? 0,
    lon ?? 0,
    isEnabled
  );

  // Fetch temperature and rainfall data
  const analyticsQuery = useQuery<LocationAnalytics | null>({
    queryKey: ['location-analytics', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) return null;

      try {
        const endDate = new Date();
        const startDate7 = subDays(endDate, 7);
        const startDate30 = subDays(endDate, 30);

        // Fetch temperature data (last 7 days for current conditions)
        const temperatureData = await nasaPowerAPI.getTemperatureData(
          lat,
          lon,
          format(startDate7, 'yyyyMMdd'),
          format(endDate, 'yyyyMMdd')
        );

        // Fetch rainfall data (last 30 days) - using NASA POWER API
        const rainfallData = await nasaPowerAPI.getRainfallData(
          lat,
          lon,
          format(startDate30, 'yyyyMMdd'),
          format(endDate, 'yyyyMMdd')
        );

        // Process temperature data
        const temps = temperatureData?.properties?.parameter?.T2M
          ? Object.values(temperatureData.properties.parameter.T2M).filter(
              (t): t is number => typeof t === 'number' && t > -100
            )
          : [];

        const tempMaxs = temperatureData?.properties?.parameter?.T2M_MAX
          ? Object.values(temperatureData.properties.parameter.T2M_MAX).filter(
              (t): t is number => typeof t === 'number' && t > -100
            )
          : [];

        const tempMins = temperatureData?.properties?.parameter?.T2M_MIN
          ? Object.values(temperatureData.properties.parameter.T2M_MIN).filter(
              (t): t is number => typeof t === 'number' && t > -100
            )
          : [];

        const currentTemp = temps.length > 0
          ? temps[temps.length - 1] // Most recent
          : 0;

        const maxTemp = tempMaxs.length > 0 ? Math.max(...tempMaxs) : 0;
        const minTemp = tempMins.length > 0 ? Math.min(...tempMins) : 0;

        // Process rainfall data from NASA POWER
        const rainfallValues = rainfallData?.properties?.parameter?.PRECTOTCORR
          ? Object.values(rainfallData.properties.parameter.PRECTOTCORR).filter(
              (p): p is number => typeof p === 'number' && p >= 0
            )
          : [];

        const totalRainfall30 = rainfallValues.reduce((sum, val) => sum + val, 0);
        const recentRainfall7 = rainfallValues.slice(-7).reduce((sum, val) => sum + val, 0);

        return {
          coordinates: { lat, lon },
          temperature: {
            current: currentTemp,
            min: minTemp,
            max: maxTemp,
            unit: '°C',
          },
          rainfall: {
            recent: recentRainfall7,
            monthly: totalRainfall30,
            unit: 'mm',
          },
          floodRisk: {
            score: 0, // Will be updated by floodRiskQuery
            level: 'unknown',
          },
          droughtRisk: {
            score: 0, // Will be updated by droughtRiskQuery
            level: 'unknown',
          },
          timestamp: new Date(),
          isComplete: false,
        };
      } catch (error) {
        console.error('Location analytics error:', error);
        return null;
      }
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
  });

  // Combine all data
  const combinedData: LocationAnalytics | null = analyticsQuery.data
    ? {
        ...analyticsQuery.data,
        floodRisk: {
          score: floodRiskQuery.data?.riskScore ?? 0,
          level: floodRiskQuery.data?.riskLevel ?? 'unknown',
          details: floodRiskQuery.data,
        },
        droughtRisk: {
          score: droughtRiskQuery.data?.riskScore ?? 0,
          level: droughtRiskQuery.data?.riskLevel ?? 'unknown',
          details: droughtRiskQuery.data,
        },
        isComplete: !floodRiskQuery.isLoading && !droughtRiskQuery.isLoading,
      }
    : null;

  return {
    data: combinedData,
    isLoading: analyticsQuery.isLoading || floodRiskQuery.isLoading || droughtRiskQuery.isLoading,
    error: analyticsQuery.error || floodRiskQuery.error || droughtRiskQuery.error,
    isComplete: combinedData?.isComplete ?? false,
  };
}

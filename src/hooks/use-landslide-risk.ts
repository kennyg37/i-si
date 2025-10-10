/**
 * React Hook: Landslide Risk Assessment
 *
 * Provides real-time landslide risk calculation for any location
 * using NASA catalog data + Open-Meteo rainfall + slope data
 */

import { useQuery } from '@tanstack/react-query';
import { calculateLandslideRiskForLocation } from '@/lib/data/landslide-risk-index';
import { landslidesCache, generateCacheKey } from '@/lib/db/cache-service';

interface UseLandslideRiskOptions {
  lat: number;
  lon: number;
  slope: number; // degrees
  enabled?: boolean;
}

export function useLandslideRisk({
  lat,
  lon,
  slope,
  enabled = true,
}: UseLandslideRiskOptions) {
  return useQuery({
    queryKey: ['landslide-risk', lat, lon, slope],
    queryFn: async () => {
      // Try cache first
      const cacheKey = generateCacheKey('landslide-risk', { lat, lon, slope });
      const cached = await landslidesCache.get(cacheKey);

      if (cached) {
        console.log('[useLandslideRisk] Cache hit');
        return cached;
      }

      // Fetch recent rainfall from Open-Meteo
      const { fetchHistoricalWeather } = await import('@/lib/api/open-meteo');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // Last 7 days

      const weatherData = await fetchHistoricalWeather({
        latitude: lat,
        longitude: lon,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        daily: ['precipitation_sum'],
        hourly: ['soil_moisture_0_to_10cm'],
      });

      const precipData = weatherData.daily?.precipitation_sum || [];

      // Calculate rainfall totals
      const rainfall24h = precipData.slice(-1)[0] || 0;
      const rainfall72h = precipData.slice(-3).reduce((sum, val) => sum + (val || 0), 0);
      const rainfall7d = precipData.reduce((sum, val) => sum + (val || 0), 0);

      // Get soil moisture (average of last 24 hours)
      const soilMoistureData = weatherData.hourly?.soil_moisture_0_to_10cm || [];
      const soilMoisture =
        soilMoistureData.length > 0
          ? soilMoistureData.slice(-24).reduce((sum, val) => sum + (val || 0), 0) / 24
          : 0.5;

      // Calculate landslide risk
      const riskResult = await calculateLandslideRiskForLocation(
        lat,
        lon,
        slope,
        rainfall24h,
        rainfall72h,
        rainfall7d,
        soilMoisture
      );

      // Cache the result
      await landslidesCache.set(cacheKey, riskResult);

      return riskResult;
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

/**
 * Hook to get landslide history for a location
 */
export function useLandslideHistory(lat: number, lon: number, radiusKm: number = 50) {
  return useQuery({
    queryKey: ['landslide-history', lat, lon, radiusKm],
    queryFn: async () => {
      const { getLandslideHistorySummary } = await import('@/lib/api/nasa-landslide');
      return getLandslideHistorySummary(lat, lon, radiusKm);
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (historical data doesn't change often)
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

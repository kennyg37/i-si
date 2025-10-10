/**
 * React Hook: Extreme Weather Events
 *
 * Fetches REAL extreme weather events using Open-Meteo data
 * with caching support for offline access
 */

import { useQuery } from '@tanstack/react-query';
import { fetchExtremeWeatherEvents, type ExtremeWeatherResponse } from '@/lib/api/extreme-weather';
import { extremeEventsCache, generateCacheKey } from '@/lib/db/cache-service';

interface UseExtremeWeatherEventsOptions {
  lat: number;
  lon: number;
  startDate: string;
  endDate: string;
  enabled?: boolean;
}

export function useExtremeWeatherEvents({
  lat,
  lon,
  startDate,
  endDate,
  enabled = true,
}: UseExtremeWeatherEventsOptions) {
  return useQuery<ExtremeWeatherResponse>({
    queryKey: ['extreme-weather-events', lat, lon, startDate, endDate],
    queryFn: async () => {
      // Try to get from cache first
      const cacheKey = generateCacheKey('extreme-events', { lat, lon, startDate, endDate });
      const cached = await extremeEventsCache.get<ExtremeWeatherResponse>(cacheKey);

      if (cached) {
        console.log('[useExtremeWeatherEvents] Cache hit');
        return cached;
      }

      // Fetch from API if not cached
      console.log('[useExtremeWeatherEvents] Fetching from Open-Meteo...');
      const data = await fetchExtremeWeatherEvents(lat, lon, startDate, endDate);

      // Cache the result
      await extremeEventsCache.set<ExtremeWeatherResponse>(cacheKey, data);

      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Helper hook for common time ranges
 */
export function useExtremeWeatherEventsForTimeRange(
  lat: number,
  lon: number,
  timeRange: '30d' | '90d' | '1y' | '2y'
) {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case '2y':
      startDate.setFullYear(endDate.getFullYear() - 2);
      break;
  }

  return useExtremeWeatherEvents({
    lat,
    lon,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  });
}

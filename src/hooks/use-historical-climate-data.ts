import { useQuery } from '@tanstack/react-query';
import { nasaPowerAPI } from '@/lib/api/nasa-power';
import { srtmAPI } from '@/lib/api/srtm';
import { subDays, format } from 'date-fns';

// Helper function to validate NASA POWER API values (filters out sentinel value -999)
function isValidValue(value: number | undefined): boolean {
  return value !== undefined && value !== null && value > -100;
}

export interface HistoricalDataPoint {
  date: string;
  temperature?: number;
  tempMax?: number;
  tempMin?: number;
  precipitation?: number;
}

export function useHistoricalTemperature(days: number = 30) {
  return useQuery({
    queryKey: ['historical-temperature', days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const data = await nasaPowerAPI.getTemperatureData(
        -1.9403, // Kigali
        29.8739,
        format(startDate, 'yyyyMMdd'),
        format(endDate, 'yyyyMMdd')
      );

      if (!data?.properties?.parameter) return [];

      const temps = data.properties.parameter.T2M || {};
      const tempMaxs = data.properties.parameter.T2M_MAX || {};
      const tempMins = data.properties.parameter.T2M_MIN || {};

      const result: HistoricalDataPoint[] = Object.keys(temps)
        .map(dateStr => ({
          date: formatDate(dateStr),
          temperature: isValidValue(temps[dateStr]) ? temps[dateStr] : undefined,
          tempMax: isValidValue(tempMaxs[dateStr]) ? tempMaxs[dateStr] : undefined,
          tempMin: isValidValue(tempMins[dateStr]) ? tempMins[dateStr] : undefined,
        }))
        .filter(d => d.temperature !== undefined); // Only include records with valid temperature

      return result;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useHistoricalPrecipitation(days: number = 30) {
  return useQuery({
    queryKey: ['historical-precipitation', days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const data = await nasaPowerAPI.getRainfallData(
        -1.9403,
        29.8739,
        format(startDate, 'yyyyMMdd'),
        format(endDate, 'yyyyMMdd')
      );

      if (!data?.properties?.parameter?.PRECTOTCORR) return [];

      const precip = data.properties.parameter.PRECTOTCORR;

      const result: HistoricalDataPoint[] = Object.keys(precip)
        .map(dateStr => ({
          date: formatDate(dateStr),
          precipitation: isValidValue(precip[dateStr]) ? precip[dateStr] : undefined,
        }))
        .filter(d => d.precipitation !== undefined); // Only include records with valid precipitation

      return result;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useClimateStatistics(days: number = 30) {
  const tempData = useHistoricalTemperature(days);
  const precipData = useHistoricalPrecipitation(days);

  const stats = {
    temperature: {
      average: 0,
      max: 0,
      min: 0,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
    },
    precipitation: {
      total: 0,
      average: 0,
      max: 0,
      rainyDays: 0,
    },
  };

  if (tempData.data && tempData.data.length > 0) {
    const temps = tempData.data.map(d => d.temperature || 0);
    stats.temperature.average = temps.reduce((a, b) => a + b, 0) / temps.length;
    stats.temperature.max = Math.max(...temps);
    stats.temperature.min = Math.min(...temps);

    // Calculate trend
    const firstHalf = temps.slice(0, Math.floor(temps.length / 2));
    const secondHalf = temps.slice(Math.floor(temps.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg + 0.5) stats.temperature.trend = 'increasing';
    else if (secondAvg < firstAvg - 0.5) stats.temperature.trend = 'decreasing';
  }

  if (precipData.data && precipData.data.length > 0) {
    const precips = precipData.data.map(d => d.precipitation || 0);
    stats.precipitation.total = precips.reduce((a, b) => a + b, 0);
    stats.precipitation.average = stats.precipitation.total / precips.length;
    stats.precipitation.max = Math.max(...precips);
    stats.precipitation.rainyDays = precips.filter(p => p > 1).length;
  }

  return {
    data: stats,
    isLoading: tempData.isLoading || precipData.isLoading,
    error: tempData.error || precipData.error,
  };
}

export function useMultiLocationComparison() {
  const locations = [
    { name: 'Kigali', lat: -1.9403, lon: 29.8739 },
    { name: 'Butare', lat: -2.5967, lon: 29.7392 },
    { name: 'Gisenyi', lat: -1.7023, lon: 29.2562 },
  ];

  return useQuery({
    queryKey: ['multi-location-comparison'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 7);

      const promises = locations.map(async loc => {
        const [tempData, elevData] = await Promise.all([
          nasaPowerAPI.getTemperatureData(
            loc.lat,
            loc.lon,
            format(startDate, 'yyyyMMdd'),
            format(endDate, 'yyyyMMdd')
          ),
          srtmAPI.getElevationData({ lat: loc.lat, lon: loc.lon }),
        ]);

        const temps = tempData?.properties?.parameter?.T2M
          ? Object.values(tempData.properties.parameter.T2M).filter(isValidValue)
          : [];
        const avgTemp = temps.length > 0
          ? (temps as number[]).reduce((a, b) => a + b, 0) / temps.length
          : 0;

        return {
          location: loc.name,
          avgTemperature: avgTemp,
          elevation: elevData?.elevation || 0,
          lat: loc.lat,
          lon: loc.lon,
        };
      });

      return Promise.all(promises);
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

function formatDate(dateStr: string): string {
  // Convert YYYYMMDD to YYYY-MM-DD
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  return dateStr;
}

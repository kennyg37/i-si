import { useQuery } from '@tanstack/react-query';
import { nasaPowerAPI } from '@/lib/api/nasa-power';
import { format, subYears, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Extended historical data hook for deep analysis (up to 10 years)
 * Uses NASA POWER API which provides data back to 1981
 */

export interface DeepHistoricalDataPoint {
  date: string;
  temperature?: number;
  precipitation?: number;
  humidity?: number;
  windSpeed?: number;
}

export interface MonthlyAggregatedData {
  month: string;
  year: number;
  avgTemp: number;
  totalPrecip: number;
  avgHumidity: number;
  maxTemp: number;
  minTemp: number;
  rainyDays: number;
}

export interface FloodRiskHistoricalData {
  year: number;
  month: number;
  extremeRainfallEvents: number; // Days with >50mm
  totalPrecipitation: number;
  maxDailyPrecipitation: number;
  consecutiveRainyDays: number;
  floodRiskScore: number; // 0-100
}

export interface DroughtRiskHistoricalData {
  year: number;
  month: number;
  dryDays: number; // Days with <1mm rain
  totalPrecipitation: number;
  precipitationDeficit: number; // Compared to long-term average
  consecutiveDryDays: number;
  droughtRiskScore: number; // 0-100
}

/**
 * Fetch deep historical climate data (1-10 years)
 */
export function useDeepHistoricalData(years: number = 3, lat: number = -1.9403, lon: number = 29.8739) {
  return useQuery({
    queryKey: ['deep-historical-data', years, lat, lon],
    queryFn: async () => {
      try {
        const endDate = new Date();
        const startDate = subYears(endDate, years);

        // Fetch all relevant parameters
        const [tempData, precipData, humidityData, windData] = await Promise.all([
          nasaPowerAPI.getTemperatureData(
            lat,
            lon,
            format(startDate, 'yyyyMMdd'),
            format(endDate, 'yyyyMMdd')
          ),
          nasaPowerAPI.getRainfallData(
            lat,
            lon,
            format(startDate, 'yyyyMMdd'),
            format(endDate, 'yyyyMMdd')
          ),
          nasaPowerAPI.getHumidityData(
            lat,
            lon,
            format(startDate, 'yyyyMMdd'),
            format(endDate, 'yyyyMMdd')
          ),
          nasaPowerAPI.getWindData(
            lat,
            lon,
            format(startDate, 'yyyyMMdd'),
            format(endDate, 'yyyyMMdd')
          ),
        ]);

        // Combine all data
        const temps = tempData?.properties?.parameter?.T2M || {};
        const precips = precipData?.properties?.parameter?.PRECTOTCORR || {};
        const humidity = humidityData?.properties?.parameter?.RH2M || {};
        const wind = windData?.properties?.parameter?.WS10M || {};

        const dataPoints: DeepHistoricalDataPoint[] = Object.keys(temps)
          .map(dateStr => ({
            date: formatDate(dateStr),
            temperature: isValidValue(temps[dateStr]) ? temps[dateStr] : undefined,
            precipitation: isValidValue(precips[dateStr]) ? precips[dateStr] : undefined,
            humidity: isValidValue(humidity[dateStr]) ? humidity[dateStr] : undefined,
            windSpeed: isValidValue(wind[dateStr]) ? wind[dateStr] : undefined,
          }))
          .filter(d => d.temperature !== undefined);

        return dataPoints;
      } catch (error) {
        console.error('Deep historical data error:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: years > 0 && years <= 10,
  });
}

/**
 * Aggregate daily data into monthly statistics
 */
export function useMonthlyAggregatedData(years: number = 3, lat: number = -1.9403, lon: number = 29.8739) {
  const { data: dailyData, isLoading } = useDeepHistoricalData(years, lat, lon);

  return useQuery({
    queryKey: ['monthly-aggregated', years, lat, lon],
    queryFn: async () => {
      if (!dailyData || dailyData.length === 0) return [];

      // Group by month
      const monthlyMap = new Map<string, DeepHistoricalDataPoint[]>();

      dailyData.forEach(point => {
        const date = new Date(point.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, []);
        }
        monthlyMap.get(monthKey)!.push(point);
      });

      // Calculate monthly stats
      const monthlyData: MonthlyAggregatedData[] = [];

      monthlyMap.forEach((points, monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const temps = points.map(p => p.temperature).filter((t): t is number => t !== undefined);
        const precips = points.map(p => p.precipitation).filter((p): p is number => p !== undefined);
        const humidities = points.map(p => p.humidity).filter((h): h is number => h !== undefined);

        monthlyData.push({
          month: monthKey,
          year,
          avgTemp: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
          totalPrecip: precips.reduce((a, b) => a + b, 0),
          avgHumidity: humidities.length > 0 ? humidities.reduce((a, b) => a + b, 0) / humidities.length : 0,
          maxTemp: temps.length > 0 ? Math.max(...temps) : 0,
          minTemp: temps.length > 0 ? Math.min(...temps) : 0,
          rainyDays: precips.filter(p => p > 1).length,
        });
      });

      return monthlyData.sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !isLoading && !!dailyData && dailyData.length > 0,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Analyze historical flood risk patterns
 */
export function useHistoricalFloodRisk(years: number = 5, lat: number = -1.9403, lon: number = 29.8739) {
  const { data: dailyData, isLoading } = useDeepHistoricalData(years, lat, lon);

  return useQuery({
    queryKey: ['historical-flood-risk', years, lat, lon],
    queryFn: async () => {
      if (!dailyData || dailyData.length === 0) return [];

      // Group by month
      const monthlyMap = new Map<string, DeepHistoricalDataPoint[]>();

      dailyData.forEach(point => {
        const date = new Date(point.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, []);
        }
        monthlyMap.get(monthKey)!.push(point);
      });

      const floodRiskData: FloodRiskHistoricalData[] = [];

      monthlyMap.forEach((points, monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const precips = points.map(p => p.precipitation).filter((p): p is number => p !== undefined);

        // Extreme rainfall events (>50mm in a day)
        const extremeEvents = precips.filter(p => p > 50).length;

        // Calculate consecutive rainy days
        let maxConsecutive = 0;
        let currentConsecutive = 0;
        points.forEach(point => {
          if (point.precipitation && point.precipitation > 5) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          } else {
            currentConsecutive = 0;
          }
        });

        const totalPrecip = precips.reduce((a, b) => a + b, 0);
        const maxDaily = precips.length > 0 ? Math.max(...precips) : 0;

        // Calculate flood risk score (0-100)
        let riskScore = 0;
        riskScore += extremeEvents * 20; // Each extreme event adds 20 points
        riskScore += maxConsecutive > 5 ? 25 : 0; // Consecutive rainy days
        riskScore += maxDaily > 80 ? 30 : maxDaily > 60 ? 20 : maxDaily > 40 ? 10 : 0;
        riskScore += totalPrecip > 300 ? 25 : totalPrecip > 200 ? 15 : 0;
        riskScore = Math.min(100, riskScore);

        floodRiskData.push({
          year,
          month,
          extremeRainfallEvents: extremeEvents,
          totalPrecipitation: totalPrecip,
          maxDailyPrecipitation: maxDaily,
          consecutiveRainyDays: maxConsecutive,
          floodRiskScore: riskScore,
        });
      });

      return floodRiskData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    },
    enabled: !isLoading && !!dailyData && dailyData.length > 0,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Analyze historical drought risk patterns
 */
export function useHistoricalDroughtRisk(years: number = 5, lat: number = -1.9403, lon: number = 29.8739) {
  const { data: dailyData, isLoading } = useDeepHistoricalData(years, lat, lon);

  return useQuery({
    queryKey: ['historical-drought-risk', years, lat, lon],
    queryFn: async () => {
      if (!dailyData || dailyData.length === 0) return [];

      // Calculate long-term average precipitation
      const allPrecips = dailyData
        .map(p => p.precipitation)
        .filter((p): p is number => p !== undefined);
      const longTermAvgDaily = allPrecips.length > 0
        ? allPrecips.reduce((a, b) => a + b, 0) / allPrecips.length
        : 3; // Rwanda average ~3mm/day

      // Group by month
      const monthlyMap = new Map<string, DeepHistoricalDataPoint[]>();

      dailyData.forEach(point => {
        const date = new Date(point.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, []);
        }
        monthlyMap.get(monthKey)!.push(point);
      });

      const droughtRiskData: DroughtRiskHistoricalData[] = [];

      monthlyMap.forEach((points, monthKey) => {
        const [year, month] = monthKey.split('-').map(Number);
        const precips = points.map(p => p.precipitation).filter((p): p is number => p !== undefined);

        // Dry days (<1mm rain)
        const dryDays = precips.filter(p => p < 1).length;

        // Calculate consecutive dry days
        let maxConsecutiveDry = 0;
        let currentConsecutiveDry = 0;
        points.forEach(point => {
          if (!point.precipitation || point.precipitation < 1) {
            currentConsecutiveDry++;
            maxConsecutiveDry = Math.max(maxConsecutiveDry, currentConsecutiveDry);
          } else {
            currentConsecutiveDry = 0;
          }
        });

        const totalPrecip = precips.reduce((a, b) => a + b, 0);
        const expectedPrecip = longTermAvgDaily * points.length;
        const deficit = expectedPrecip - totalPrecip;
        const deficitPercent = (deficit / expectedPrecip) * 100;

        // Calculate drought risk score (0-100)
        let riskScore = 0;
        riskScore += deficitPercent > 50 ? 35 : deficitPercent > 30 ? 25 : deficitPercent > 15 ? 15 : 0;
        riskScore += maxConsecutiveDry > 20 ? 30 : maxConsecutiveDry > 14 ? 20 : maxConsecutiveDry > 7 ? 10 : 0;
        riskScore += dryDays > 20 ? 25 : dryDays > 15 ? 15 : 0;
        riskScore += totalPrecip < 30 ? 10 : 0; // Very low absolute rainfall
        riskScore = Math.min(100, riskScore);

        droughtRiskData.push({
          year,
          month,
          dryDays,
          totalPrecipitation: totalPrecip,
          precipitationDeficit: deficit,
          consecutiveDryDays: maxConsecutiveDry,
          droughtRiskScore: riskScore,
        });
      });

      return droughtRiskData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    },
    enabled: !isLoading && !!dailyData && dailyData.length > 0,
    staleTime: 1000 * 60 * 60,
  });
}

// Helper functions
function isValidValue(value: number | undefined): boolean {
  return value !== undefined && value !== null && value > -100;
}

function formatDate(dateStr: string): string {
  if (dateStr.length === 8) {
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  }
  return dateStr;
}

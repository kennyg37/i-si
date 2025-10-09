import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { nasaPowerAPI, sentinelHubAPI, srtmAPI } from '../api';


// NASA POWER API hooks
export const useNASAPowerData = (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  parameters: string
) => {
  return useQuery({
    queryKey: ['nasa-power', lat, lon, startDate, endDate, parameters],
    queryFn: () => nasaPowerAPI.getClimateData({
      lat,
      lon,
      start: startDate.replace(/-/g, ''),
      end: endDate.replace(/-/g, ''),
      parameters
    }),
    enabled: !!(lat && lon && startDate && endDate && parameters),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
  });
};

export const useRainfallData = (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ['rainfall', lat, lon, startDate, endDate],
    queryFn: () => nasaPowerAPI.getRainfallData(lat, lon, startDate.replace(/-/g, ''), endDate.replace(/-/g, '')),
    enabled: !!(lat && lon && startDate && endDate),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
  });
};

export const useTemperatureData = (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ['temperature', lat, lon, startDate, endDate],
    queryFn: () => nasaPowerAPI.getTemperatureData(lat, lon, startDate.replace(/-/g, ''), endDate.replace(/-/g, '')),
    enabled: !!(lat && lon && startDate && endDate),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
  });
};

// Drought risk using NASA POWER API
export const useDroughtRisk = (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ['drought-risk', lat, lon, startDate, endDate],
    queryFn: async () => {
      try {
        // Use NASA POWER API for drought risk calculation
        const rainfallData = await nasaPowerAPI.getRainfallData(lat, lon, startDate.replace(/-/g, ''), endDate.replace(/-/g, ''));
        if (!rainfallData?.properties?.parameter?.PRECTOTCORR) {
          return null;
        }

        const precipitationValues = Object.values(rainfallData.properties.parameter.PRECTOTCORR)
          .filter((p): p is number => typeof p === 'number' && p >= 0);

        if (precipitationValues.length === 0) {
          return null;
        }

        const totalPrecipitation = precipitationValues.reduce((sum, val) => sum + val, 0);
        const averagePrecipitation = totalPrecipitation / precipitationValues.length;

        // Simple drought risk calculation based on precipitation deficit
        const expectedPrecipitation = 50; // mm per month baseline for Rwanda
        const droughtRisk = Math.max(0, (expectedPrecipitation - averagePrecipitation) / expectedPrecipitation);

        return {
          droughtRisk: Math.min(1, droughtRisk),
          averagePrecipitation,
          recentAverage: averagePrecipitation,
          riskLevel: droughtRisk > 0.3 ? 'high' : droughtRisk > 0.1 ? 'medium' : 'low'
        };
      } catch (error) {
        console.error('Drought risk calculation error:', error);
        return null;
      }
    },
    enabled: !!(lat && lon && startDate && endDate),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 4,
    retry: 2,
  });
};

// Sentinel Hub API hooks
export const useNDVIData = (
  bbox: [number, number, number, number],
  timeRange: string
) => {
  return useQuery({
    queryKey: ['ndvi', bbox, timeRange],
    queryFn: () => sentinelHubAPI.getVegetationHealth(bbox, timeRange),
    enabled: !!(bbox && timeRange),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (satellite data doesn't change frequently)
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

// SRTM API hooks
export const useElevationData = (
  lat: number,
  lon: number,
  radius: number = 1000
) => {
  return useQuery({
    queryKey: ['elevation', lat, lon, radius],
    queryFn: () => srtmAPI.getElevationData({ lat, lon, radius }),
    enabled: !!(lat && lon),
    staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days (elevation doesn't change)
    gcTime: 1000 * 60 * 60 * 24 * 30,
  });
};

export const useFloodRisk = (
  lat: number,
  lon: number,
  radius: number = 1000
) => {
  return useQuery({
    queryKey: ['flood-risk', lat, lon, radius],
    queryFn: () => srtmAPI.getFloodRiskAssessment(lat, lon, radius),
    enabled: !!(lat && lon),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
};

// Combined climate risk hook
export const useClimateRiskIndex = (
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) => {
  const rainfallQuery = useRainfallData(lat, lon, startDate, endDate);
  const temperatureQuery = useTemperatureData(lat, lon, startDate, endDate);
  const droughtQuery = useDroughtRisk(lat, lon, startDate, endDate);
  const floodQuery = useFloodRisk(lat, lon);
  
  return useQuery({
    queryKey: ['climate-risk-index', lat, lon, startDate, endDate],
    queryFn: () => {
      // This would calculate the combined risk index
      // Implementation depends on the specific risk calculation logic
      return {
        riskIndex: 0.5, // Placeholder
        components: {
          precipitation: rainfallQuery.data,
          temperature: temperatureQuery.data,
          drought: droughtQuery.data,
          flood: floodQuery.data
        }
      };
    },
    enabled: !!(lat && lon && startDate && endDate),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
  });
};

// Historical data comparison hook
export const useHistoricalComparison = (
  lat: number,
  lon: number,
  currentStartDate: string,
  currentEndDate: string,
  historicalYears: number = 5
) => {
  const currentYear = new Date(currentStartDate).getFullYear();
  const historicalStartDate = `${currentYear - historicalYears}-01-01`;
  const historicalEndDate = `${currentYear - 1}-12-31`;
  
  const currentData = useRainfallData(lat, lon, currentStartDate, currentEndDate);
  const historicalData = useRainfallData(lat, lon, historicalStartDate, historicalEndDate);
  
  return useQuery({
    queryKey: ['historical-comparison', lat, lon, currentStartDate, currentEndDate, historicalYears],
    queryFn: () => {
      if (!currentData.data || !historicalData.data) return null;
      
      // Calculate anomalies and trends
      return {
        current: currentData.data,
        historical: historicalData.data,
        anomaly: 0, // Placeholder for anomaly calculation
        trend: 'stable' // Placeholder for trend calculation
      };
    },
    enabled: !!(lat && lon && currentStartDate && currentEndDate),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 4,
  });
};

// Multi-point data hook for map visualization
export const useMultiPointClimateData = (
  points: Array<{ lat: number; lon: number }>,
  startDate: string,
  endDate: string
) => {
  return useQuery({
    queryKey: ['multi-point-climate', points, startDate, endDate],
    queryFn: async () => {
      const promises = points.map(point => 
        Promise.all([
          nasaPowerAPI.getRainfallData(point.lat, point.lon, startDate.replace(/-/g, ''), endDate.replace(/-/g, '')),
          nasaPowerAPI.getTemperatureData(point.lat, point.lon, startDate.replace(/-/g, ''), endDate.replace(/-/g, '')),
          srtmAPI.getElevationData({ lat: point.lat, lon: point.lon })
        ])
      );
      
      const results = await Promise.all(promises);
      
      return points.map((point, index) => ({
        location: point,
        rainfall: results[index][0],
        temperature: results[index][1],
        elevation: results[index][2]
      }));
    },
    enabled: !!(points.length > 0 && startDate && endDate),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 2,
  });
};

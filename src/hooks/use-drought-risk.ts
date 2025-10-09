import { useQuery } from '@tanstack/react-query';
import { nasaPowerAPI } from '@/lib/api/nasa-power';
import { format, subDays } from 'date-fns';

export interface DroughtRiskData {
  coordinates: {
    lat: number;
    lon: number;
  };
  riskScore: number; // 0-1 scale
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  factors: {
    precipitation: {
      recent: number; // mm in last 30 days
      historical: number; // average mm for this period
      anomaly: number; // -1 to 1 scale
    };
    temperature: {
      current: number; // °C
      anomaly: number; // difference from normal
    };
    spi: number; // Standardized Precipitation Index
  };
  timestamp: Date;
}

/**
 * Calculate drought risk index based on precipitation deficit and temperature anomaly
 */
export function useDroughtRisk(
  lat: number,
  lon: number,
  enabled: boolean = true
) {
  return useQuery<DroughtRiskData | null>({
    queryKey: ['drought-risk', lat, lon],
    queryFn: async () => {
      try {
        const endDate = new Date();
        const startDate30 = subDays(endDate, 30);
        const startDate90 = subDays(endDate, 90);

        // Fetch recent precipitation data (NASA POWER - last 30 days)
        const recentRainfallData = await nasaPowerAPI.getRainfallData(
          lat,
          lon,
          format(startDate30, 'yyyyMMdd'),
          format(endDate, 'yyyyMMdd')
        );

        // Fetch historical precipitation data (previous 60 days for comparison)
        const historicalRainfallData = await nasaPowerAPI.getRainfallData(
          lat,
          lon,
          format(startDate90, 'yyyyMMdd'),
          format(startDate30, 'yyyyMMdd')
        );

        // Fetch temperature data
        const temperatureData = await nasaPowerAPI.getTemperatureData(
          lat,
          lon,
          format(startDate30, 'yyyyMMdd'),
          format(endDate, 'yyyyMMdd')
        );

        // Calculate recent precipitation (last 30 days)
        const recentPrecipValues = recentRainfallData?.properties?.parameter?.PRECTOTCORR
          ? Object.values(recentRainfallData.properties.parameter.PRECTOTCORR).filter(
              (p): p is number => typeof p === 'number' && p >= 0
            )
          : [];
        const recentPrecip = recentPrecipValues.reduce((sum, val) => sum + val, 0);

        // Calculate historical average (previous 60 days)
        const historicalPrecipValues = historicalRainfallData?.properties?.parameter?.PRECTOTCORR
          ? Object.values(historicalRainfallData.properties.parameter.PRECTOTCORR).filter(
              (p): p is number => typeof p === 'number' && p >= 0
            )
          : [];
        const historicalPrecip = historicalPrecipValues.reduce((sum, val) => sum + val, 0);
        const historicalAvg = historicalPrecipValues.length > 0
          ? historicalPrecip / historicalPrecipValues.length
          : 0;

        // Calculate precipitation anomaly
        const expectedPrecip = historicalAvg * 30;
        const precipAnomaly = expectedPrecip > 0
          ? (recentPrecip - expectedPrecip) / expectedPrecip
          : 0;

        // Calculate temperature data
        const temps = temperatureData?.properties?.parameter?.T2M
          ? Object.values(temperatureData.properties.parameter.T2M).filter(
              (t): t is number => typeof t === 'number' && t > -100
            )
          : [];

        const avgTemp = temps.length > 0
          ? temps.reduce((a, b) => a + b, 0) / temps.length
          : 25; // Default for Rwanda

        // Temperature anomaly (Rwanda normal is ~20-25°C)
        const normalTemp = 22.5;
        const tempAnomaly = avgTemp - normalTemp;

        // Calculate Standardized Precipitation Index (simplified)
        // Negative values indicate drought
        const spi = precipAnomaly;

        // Calculate drought risk score (0-1)
        // Drought is primarily driven by precipitation deficit, exacerbated by high temperatures
        let riskScore = 0;

        // Precipitation deficit component (60% weight)
        // More negative anomaly = more severe drought
        if (precipAnomaly < -0.7) {
          riskScore += 0.6; // Severe deficit (>70% below normal)
        } else if (precipAnomaly < -0.5) {
          riskScore += 0.48; // Major deficit (50-70% below normal)
        } else if (precipAnomaly < -0.3) {
          riskScore += 0.36; // Moderate deficit (30-50% below normal)
        } else if (precipAnomaly < -0.15) {
          riskScore += 0.24; // Mild deficit (15-30% below normal)
        } else if (precipAnomaly < -0.05) {
          riskScore += 0.12; // Slight deficit (5-15% below normal)
        }

        // Temperature anomaly component (25% weight)
        // Higher temps increase evapotranspiration and water stress
        if (tempAnomaly > 4) {
          riskScore += 0.25; // Extreme heat
        } else if (tempAnomaly > 3) {
          riskScore += 0.20; // Very high temps
        } else if (tempAnomaly > 2) {
          riskScore += 0.15; // High temps
        } else if (tempAnomaly > 1) {
          riskScore += 0.10; // Moderately high
        } else if (tempAnomaly > 0.5) {
          riskScore += 0.05; // Slightly elevated
        }

        // Absolute precipitation threshold (15% weight)
        // Very low rainfall regardless of historical average
        // Rwanda typical monthly rainfall: 60-150mm depending on season
        if (recentPrecip < 20) {
          riskScore += 0.15; // Critically low (<20mm/month)
        } else if (recentPrecip < 40) {
          riskScore += 0.12; // Very low (<40mm/month)
        } else if (recentPrecip < 60) {
          riskScore += 0.09; // Low (<60mm/month)
        } else if (recentPrecip < 80) {
          riskScore += 0.06; // Below average
        } else if (recentPrecip < 100) {
          riskScore += 0.03; // Slightly below average
        }

        // Cap at 1.0
        riskScore = Math.min(1, riskScore);

        // Determine risk level
        let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
        if (riskScore >= 0.75) riskLevel = 'extreme';
        else if (riskScore >= 0.5) riskLevel = 'high';
        else if (riskScore >= 0.25) riskLevel = 'medium';
        else riskLevel = 'low';

        return {
          coordinates: { lat, lon },
          riskScore,
          riskLevel,
          factors: {
            precipitation: {
              recent: recentPrecip,
              historical: expectedPrecip,
              anomaly: precipAnomaly,
            },
            temperature: {
              current: avgTemp,
              anomaly: tempAnomaly,
            },
            spi,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        console.error('Drought risk calculation error:', error);
        return null;
      }
    },
    enabled: enabled && !!lat && !!lon,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}

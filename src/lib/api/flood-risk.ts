import { chirpsAPI } from './chirps';
import { srtmAPI } from './srtm';
import type { Coordinates } from '@/types';

export interface FloodRiskData {
  coordinates: Coordinates;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  factors: {
    rainfall: {
      recent: number;
      average: number;
      anomaly: number;
      contribution: number;
    };
    elevation: {
      value: number;
      contribution: number;
    };
    slope: {
      value: number;
      contribution: number;
    };
  };
  timestamp: Date;
}

export class FloodRiskAPI {
  /**
   * Calculate comprehensive flood risk score for a location
   * Combines CHIRPS rainfall data with SRTM elevation/slope analysis
   */
  async calculateFloodRisk(
    lat: number,
    lon: number,
    startDate?: string,
    endDate?: string
  ): Promise<FloodRiskData | null> {
    try {
      // Default to last 30 days if not specified
      if (!endDate) {
        endDate = new Date().toISOString().split('T')[0];
      }
      if (!startDate) {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        startDate = date.toISOString().split('T')[0];
      }

      // Fetch data in parallel
      const [rainfallData, elevationData] = await Promise.all([
        chirpsAPI.getRainfallTimeSeries(lat, lon, startDate, endDate),
        srtmAPI.getElevationData({ lat, lon })
      ]);

      if (!rainfallData || !elevationData) {
        return null;
      }

      // Calculate rainfall factors
      const precipValues = Object.values(rainfallData.data || {}).map((d: any) => d.precipitation || 0);
      const recentPrecip = precipValues.slice(-7); // Last 7 days
      const avgRecent = recentPrecip.reduce((a, b) => a + b, 0) / recentPrecip.length;
      const avgTotal = precipValues.reduce((a, b) => a + b, 0) / precipValues.length;
      const rainfallAnomaly = avgTotal > 0 ? (avgRecent - avgTotal) / avgTotal : 0;

      // Calculate risk contributions (0-1 scale)
      const rainfallContribution = this.calculateRainfallRisk(avgRecent, rainfallAnomaly);
      const elevationContribution = this.calculateElevationRisk(elevationData.elevation);
      const slopeContribution = this.calculateSlopeRisk(elevationData.slope);

      // Weighted flood risk score
      const riskScore = (
        0.5 * rainfallContribution +     // 50% weight on rainfall
        0.3 * elevationContribution +     // 30% weight on elevation
        0.2 * slopeContribution           // 20% weight on slope
      );

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
      if (riskScore >= 0.75) {
        riskLevel = 'extreme';
      } else if (riskScore >= 0.5) {
        riskLevel = 'high';
      } else if (riskScore >= 0.25) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      return {
        coordinates: { lat, lon },
        riskScore,
        riskLevel,
        factors: {
          rainfall: {
            recent: avgRecent,
            average: avgTotal,
            anomaly: rainfallAnomaly,
            contribution: rainfallContribution
          },
          elevation: {
            value: elevationData.elevation,
            contribution: elevationContribution
          },
          slope: {
            value: elevationData.slope,
            contribution: slopeContribution
          }
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Flood Risk Calculation Error:', error);
      return null;
    }
  }

  /**
   * Calculate rainfall risk contribution (0-1)
   */
  private calculateRainfallRisk(recentRainfall: number, anomaly: number): number {
    // High recent rainfall increases risk
    let rainfallRisk = 0;

    // Absolute rainfall contribution (mm/day)
    if (recentRainfall > 50) {
      rainfallRisk += 0.5; // Heavy rain
    } else if (recentRainfall > 30) {
      rainfallRisk += 0.3; // Moderate rain
    } else if (recentRainfall > 15) {
      rainfallRisk += 0.15; // Light rain
    }

    // Rainfall anomaly contribution
    if (anomaly > 0.5) {
      rainfallRisk += 0.5; // Much higher than average
    } else if (anomaly > 0.25) {
      rainfallRisk += 0.3; // Higher than average
    } else if (anomaly > 0) {
      rainfallRisk += 0.1; // Slightly higher than average
    }

    return Math.min(1, rainfallRisk);
  }

  /**
   * Calculate elevation risk contribution (0-1)
   */
  private calculateElevationRisk(elevation: number): number {
    // Lower elevation = higher flood risk
    // Rwanda elevation range: ~900m to ~4500m
    // High risk below 1200m, low risk above 2000m

    if (elevation < 1000) {
      return 1.0; // Very high risk
    } else if (elevation < 1200) {
      return 0.7; // High risk
    } else if (elevation < 1500) {
      return 0.4; // Moderate risk
    } else if (elevation < 2000) {
      return 0.2; // Low risk
    } else {
      return 0.05; // Very low risk
    }
  }

  /**
   * Calculate slope risk contribution (0-1)
   */
  private calculateSlopeRisk(slope: number): number {
    // Lower slope = higher flood risk (water accumulates)
    // Slope in degrees

    if (slope < 2) {
      return 1.0; // Flat areas - very high risk
    } else if (slope < 5) {
      return 0.7; // Gentle slope - high risk
    } else if (slope < 10) {
      return 0.4; // Moderate slope - moderate risk
    } else if (slope < 20) {
      return 0.2; // Steep slope - low risk
    } else {
      return 0.05; // Very steep - very low risk
    }
  }

  /**
   * Generate flood risk heatmap data for a bounding box
   * Returns grid of risk scores
   */
  async generateFloodRiskGrid(
    bbox: [number, number, number, number],
    gridSize: number = 10
  ): Promise<Array<FloodRiskData>> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const risks: Array<FloodRiskData> = [];

    const latStep = (maxLat - minLat) / gridSize;
    const lonStep = (maxLon - minLon) / gridSize;

    // Calculate risk for each grid point
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const lat = minLat + i * latStep;
        const lon = minLon + j * lonStep;

        const risk = await this.calculateFloodRisk(lat, lon);
        if (risk) {
          risks.push(risk);
        }
      }
    }

    return risks;
  }
}

export const floodRiskAPI = new FloodRiskAPI();

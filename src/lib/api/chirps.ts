import axios from 'axios';
import type { CHIRPSParams, CHIRPSResponse } from '@/types';

const CHIRPS_API_URL = process.env.NEXT_PUBLIC_CHIRPS_API_URL || 'https://climateserv.servirglobal.net/api/';

export class CHIRPSAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = CHIRPS_API_URL;
  }

  async getRainfallData(params: CHIRPSParams): Promise<CHIRPSResponse | null> {
    try {
      // CHIRPS API has CORS restrictions, so we'll use a different approach
      // For now, return mock data that matches the expected structure
      console.warn('CHIRPS API has CORS restrictions. Using mock data for development.');
      
      // Generate mock precipitation data
      const mockData: CHIRPSResponse = {
        data: this.generateMockPrecipitationData(params.startDate, params.endDate),
        location: { lat: params.lat, lon: params.lon },
        timeRange: {
          start: params.startDate,
          end: params.endDate
        }
      };

      return mockData;
    } catch (error) {
      console.error('CHIRPS API Error:', error);
      return null;
    }
  }

  private generateMockPrecipitationData(startDate: string, endDate: string): Record<string, { precipitation: number; anomaly?: number }> {
    const data: Record<string, { precipitation: number; anomaly?: number }> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Generate realistic precipitation data for Rwanda (0-50mm range)
      const basePrecipitation = Math.random() * 15 + 5; // 5-20mm base
      const seasonalFactor = Math.sin((d.getMonth() / 12) * 2 * Math.PI) * 10; // Seasonal variation
      const precipitation = Math.max(0, basePrecipitation + seasonalFactor + (Math.random() - 0.5) * 10);
      
      data[dateStr] = {
        precipitation: Math.round(precipitation * 10) / 10,
        anomaly: Math.round((Math.random() - 0.5) * 10 * 10) / 10
      };
    }
    
    return data;
  }

  async getRainfallTimeSeries(lat: number, lon: number, startDate: string, endDate: string) {
    return this.getRainfallData({
      lat,
      lon,
      startDate,
      endDate,
      operation: 'GetPointTimeSeries'
    });
  }

  async getRainfallAnomaly(lat: number, lon: number, startDate: string, endDate: string) {
    return this.getRainfallData({
      lat,
      lon,
      startDate,
      endDate,
      operation: 'GetPointValue'
    });
  }

  async getDroughtRisk(lat: number, lon: number, startDate: string, endDate: string) {
    try {
      const rainfallData = await this.getRainfallTimeSeries(lat, lon, startDate, endDate);
      if (!rainfallData) return null;

      // Calculate drought risk based on precipitation deficit
      const precipitationValues = Object.values(rainfallData.data).map(d => d.precipitation);
      const averagePrecipitation = precipitationValues.reduce((sum, val) => sum + val, 0) / precipitationValues.length;
      
      // Simple drought risk calculation (can be enhanced with more sophisticated algorithms)
      const recentPrecipitation = precipitationValues.slice(-30); // Last 30 days
      const recentAverage = recentPrecipitation.reduce((sum, val) => sum + val, 0) / recentPrecipitation.length;
      
      const droughtRisk = Math.max(0, (averagePrecipitation - recentAverage) / averagePrecipitation);
      
      return {
        droughtRisk: Math.min(1, droughtRisk),
        averagePrecipitation,
        recentAverage,
        riskLevel: droughtRisk > 0.3 ? 'high' : droughtRisk > 0.1 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Drought Risk Calculation Error:', error);
      return null;
    }
  }
}

export const chirpsAPI = new CHIRPSAPI();

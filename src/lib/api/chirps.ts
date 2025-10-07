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
      const response = await axios.post(`${this.baseURL}`, {
        operation: params.operation,
        parameters: {
          lat: params.lat,
          lon: params.lon,
          startDate: params.startDate,
          endDate: params.endDate,
          dataset: 'CHIRPS',
          dataSource: 'CHIRPS_DAILY'
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('CHIRPS API Error:', error);
      return null;
    }
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

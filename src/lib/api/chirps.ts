import axios from 'axios';
import type { CHIRPSParams, CHIRPSResponse } from '@/types';

export class CHIRPSAPI {
  private proxyURL: string;

  constructor() {
    this.proxyURL = '/api/proxy/chirps';
  }

  async getRainfallData(params: CHIRPSParams): Promise<CHIRPSResponse | null> {
    try {
      const requestBody = {
        datasetType: 3, // CHIRPS
        operationType: 5, // GetPointTimeSeries
        intervalType: 0, // Daily
        geometry: {
          type: 'Point',
          coordinates: [params.lon, params.lat]
        },
        beginDate: params.startDate,
        endDate: params.endDate
      };

      // Submit request via proxy
      const submitResponse = await axios.post(this.proxyURL, {
        action: 'submitDataRequest',
        data: requestBody
      });

      const requestId = submitResponse.data.id;

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const progressResponse = await axios.post(this.proxyURL, {
          action: 'getDataRequestProgress',
          data: { id: requestId }
        });

        if (progressResponse.data.progress === 100) {
          const dataResponse = await axios.post(this.proxyURL, {
            action: 'getDataFromRequest',
            data: { id: requestId }
          });

          const data: Record<string, { precipitation: number; anomaly?: number }> = {};

          if (dataResponse.data && dataResponse.data.data) {
            dataResponse.data.data.forEach((item: any) => {
              const date = item.date || item.epochTime;
              const dateStr = new Date(date).toISOString().split('T')[0];
              data[dateStr] = {
                precipitation: item.value || 0,
                anomaly: item.anomaly
              };
            });
          }

          return {
            data,
            location: { lat: params.lat, lon: params.lon },
            timeRange: {
              start: params.startDate,
              end: params.endDate
            }
          };
        }

        attempts++;
      }

      throw new Error('Request timed out');
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

      const precipitationValues = Object.values(rainfallData.data).map(d => d.precipitation);
      const averagePrecipitation = precipitationValues.reduce((sum, val) => sum + val, 0) / precipitationValues.length;

      const recentPrecipitation = precipitationValues.slice(-30);
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

import axios from 'axios';
import type { NASAPowerParams, NASAPowerResponse } from '@/types';

export class NASAPowerAPI {
  private proxyURL: string;

  constructor() {
    this.proxyURL = 'https://power.larc.nasa.gov/api';
  }

  async getClimateData(params: NASAPowerParams): Promise<NASAPowerResponse | null> {
    try {
      // Validate date range
      const endDate = new Date(params.end);
      const today = new Date();

      if (endDate > today) {
        params.end = today.toISOString().slice(0, 10).replace(/-/g, '');
      }

      const startDate = new Date(params.start);
      const maxPastDate = new Date();
      maxPastDate.setFullYear(maxPastDate.getFullYear() - 5);

      if (startDate < maxPastDate) {
        params.start = maxPastDate.toISOString().slice(0, 10).replace(/-/g, '');
      }

      const url = `${this.proxyURL}/temporal/daily/point`

      const response = await axios.get(url, {
        params: {
          parameters: params.parameters,
          latitude: params.lat,
          longitude: params.lon,
          start: params.start,
          end: params.end,
          community: 'RE',
          format: 'JSON'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('NASA POWER API Error:', error);
      return null;
    }
  }

  async getRainfallData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'PRECTOTCORR'
    });
  }

  async getTemperatureData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'T2M,T2M_MAX,T2M_MIN'
    });
  }

  async getSolarData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'ALLSKY_SFC_SW_DWN'
    });
  }

  async getWindData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'WS10M,WS10M_MAX,WS10M_MIN'
    });
  }

  async getHumidityData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'RH2M'
    });
  }
}

export const nasaPowerAPI = new NASAPowerAPI();

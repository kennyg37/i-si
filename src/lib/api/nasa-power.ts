import axios from 'axios';
import type { NASAPowerParams, NASAPowerResponse } from '@/types';

const NASA_POWER_BASE_URL = process.env.NEXT_PUBLIC_NASA_POWER_BASE_URL || 'https://power.larc.nasa.gov/api/';

export class NASAPowerAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = NASA_POWER_BASE_URL;
  }

  async getClimateData(params: NASAPowerParams): Promise<NASAPowerResponse | null> {
    try {
      const response = await axios.get(`${this.baseURL}temporal/hourly/point`, {
        params: {
          parameters: params.parameters,
          community: 'RE',
          longitude: params.lon,
          latitude: params.lat,
          start: params.start,
          end: params.end,
          format: 'json'
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
      parameters: 'PRECTOT' // Precipitation total
    });
  }

  async getTemperatureData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'T2M,T2M_MAX,T2M_MIN' // Temperature at 2m, max, min
    });
  }

  async getSolarRadiationData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'ALLSKY_SFC_SW_DWN' // All-sky surface shortwave downward irradiance
    });
  }
}

export const nasaPowerAPI = new NASAPowerAPI();

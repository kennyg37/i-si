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
      // Validate date range - NASA POWER doesn't support future dates
      const endDate = new Date(params.end);
      const today = new Date();
      
      if (endDate > today) {
        console.warn('NASA POWER API: End date is in the future. Adjusting to today.');
        params.end = today.toISOString().slice(0, 10).replace(/-/g, '');
      }

      // Validate start date - ensure it's not too far in the past
      const startDate = new Date(params.start);
      const maxPastDate = new Date();
      maxPastDate.setFullYear(maxPastDate.getFullYear() - 5); // NASA POWER typically has 5 years of data
      
      if (startDate < maxPastDate) {
        console.warn('NASA POWER API: Start date is too far in the past. Adjusting to 5 years ago.');
        params.start = maxPastDate.toISOString().slice(0, 10).replace(/-/g, '');
      }

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
      
      // If API fails, return mock data for development
      console.warn('NASA POWER API failed. Using mock data for development.');
      return this.generateMockClimateData(params);
    }
  }

  private generateMockClimateData(params: NASAPowerParams): NASAPowerResponse {
    const startDate = new Date(params.start);
    const endDate = new Date(params.end);
    const data: Record<string, number> = {};
    
    // Generate mock data for each day
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
      
      if (params.parameters.includes('PRECTOT')) {
        // Mock precipitation data (0-30mm range)
        data[dateStr] = Math.round((Math.random() * 20 + 5) * 10) / 10;
      } else if (params.parameters.includes('T2M')) {
        // Mock temperature data (15-30°C range for Rwanda)
        data[dateStr] = Math.round((Math.random() * 15 + 15) * 10) / 10;
      } else if (params.parameters.includes('T2M_MAX')) {
        // Mock max temperature
        data[dateStr] = Math.round((Math.random() * 10 + 25) * 10) / 10;
      } else if (params.parameters.includes('T2M_MIN')) {
        // Mock min temperature
        data[dateStr] = Math.round((Math.random() * 10 + 10) * 10) / 10;
      } else {
        // Default mock value
        data[dateStr] = Math.round((Math.random() * 100) * 10) / 10;
      }
    }

    return {
      geometry: {
        type: 'Point',
        coordinates: [params.lon, params.lat]
      },
      properties: {
        parameter: {
          [params.parameters]: data
        }
      },
      metadata: {
        title: 'Mock Climate Data',
        sources: ['Development Mock']
      }
    };
  }

  async getRainfallData(lat: number, lon: number, start: string, end: string) {
    return this.getClimateData({
      lat,
      lon,
      start,
      end,
      parameters: 'PRECTOT' 
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

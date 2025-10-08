import axios from 'axios';
import type { SRTMParams, SRTMResponse } from '@/types';

export class SRTMAPI {
  private proxyURL: string;

  constructor() {
    this.proxyURL = '/api/proxy/elevation';
  }

  async getElevationData(params: SRTMParams): Promise<SRTMResponse | null> {
    try {
      const response = await axios.post(this.proxyURL, {
        locations: [
          {
            latitude: params.lat,
            longitude: params.lon
          }
        ]
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        const elevation = response.data.results[0].elevation;

        const { slope, aspect } = await this.calculateTerrainMetrics(params.lat, params.lon, elevation);
        const floodRisk = this.calculateFloodRisk(elevation, slope);

        return {
          elevation,
          slope,
          aspect,
          location: {
            lat: params.lat,
            lon: params.lon
          },
          floodRisk
        };
      }

      throw new Error('No elevation data returned');
    } catch (error) {
      console.error('SRTM API Error:', error);
      return null;
    }
  }

  private async calculateTerrainMetrics(lat: number, lon: number, centerElevation: number): Promise<{ slope: number; aspect: number }> {
    try {
      const offset = 0.001;

      const points = [
        { latitude: lat + offset, longitude: lon },
        { latitude: lat - offset, longitude: lon },
        { latitude: lat, longitude: lon + offset },
        { latitude: lat, longitude: lon - offset }
      ];

      const response = await axios.post(this.proxyURL, { locations: points });

      if (response.data && response.data.results && response.data.results.length === 4) {
        const elevations = response.data.results.map((r: any) => r.elevation);
        const [north, south, east, west] = elevations;

        const dz_dx = (east - west) / (2 * 111320 * offset);
        const dz_dy = (north - south) / (2 * 110540 * offset);
        const slope = Math.atan(Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy)) * (180 / Math.PI);

        let aspect = Math.atan2(dz_dy, -dz_dx) * (180 / Math.PI);
        if (aspect < 0) aspect += 360;

        return { slope, aspect };
      }

      return { slope: 5, aspect: 180 };
    } catch (error) {
      console.error('Terrain metrics calculation error:', error);
      return { slope: 5, aspect: 180 };
    }
  }

  private calculateFloodRisk(elevation: number, slope: number): SRTMResponse['floodRisk'] {
    const factors: string[] = [];
    let score = 0;

    if (elevation < 1000) {
      score += 0.4;
      factors.push('Low elevation');
    } else if (elevation < 1500) {
      score += 0.2;
      factors.push('Moderate elevation');
    }

    if (slope < 5) {
      score += 0.3;
      factors.push('Low slope - poor drainage');
    } else if (slope < 15) {
      score += 0.1;
      factors.push('Moderate slope');
    }

    score += 0.1;
    factors.push('Terrain analysis');

    const level = score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low';

    return {
      level,
      score: Math.min(1, score),
      factors
    };
  }

  async getFloodRiskAssessment(lat: number, lon: number, radius: number = 1000) {
    return this.getElevationData({ lat, lon, radius });
  }

  async getTerrainProfile(bbox: [number, number, number, number]) {
    try {
      const points = this.generateGridPoints(bbox, 10);
      const elevationData = await Promise.all(
        points.map(point => this.getElevationData(point))
      );

      return elevationData.filter(data => data !== null);
    } catch (error) {
      console.error('Terrain Profile Error:', error);
      return [];
    }
  }

  private generateGridPoints(bbox: [number, number, number, number], gridSize: number) {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const points: SRTMParams[] = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = minLat + (maxLat - minLat) * (i / (gridSize - 1));
        const lon = minLon + (maxLon - minLon) * (j / (gridSize - 1));
        points.push({ lat, lon });
      }
    }

    return points;
  }
}

export const srtmAPI = new SRTMAPI();

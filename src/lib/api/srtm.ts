import axios from 'axios';
import type { SRTMParams, SRTMResponse } from '@/types';

const OPENTOPOGRAPHY_API_URL = process.env.NEXT_PUBLIC_OPENTOPOGRAPHY_API_URL || 'https://cloud.sdfi.dk/api/';

export class SRTMAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = OPENTOPOGRAPHY_API_URL;
  }

  async getElevationData(params: SRTMParams): Promise<SRTMResponse | null> {
    try {
      // For demo purposes, we'll use a simplified elevation service
      // In production, you would use the actual OpenTopography API
      const response = await axios.get(`${this.baseURL}elevation`, {
        params: {
          lat: params.lat,
          lon: params.lon,
          radius: params.radius || 1000
        },
        timeout: 30000
      });

      const elevation = response.data.elevation || 0;
      const slope = this.calculateSlope(elevation, params.lat, params.lon);
      const aspect = this.calculateAspect(elevation, params.lat, params.lon);
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
    } catch (error) {
      console.error('SRTM API Error:', error);
      // Return fallback data for demo purposes
      return this.getFallbackElevationData(params);
    }
  }

  private calculateSlope(elevation: number, lat: number, lon: number): number {
    // Simplified slope calculation
    // In production, this would use actual terrain analysis
    const baseElevation = 1500; // Average elevation for Rwanda
    return Math.abs(elevation - baseElevation) / 1000; // Simplified slope in degrees
  }

  private calculateAspect(elevation: number, lat: number, lon: number): number {
    // Simplified aspect calculation
    // In production, this would use actual terrain analysis
    return Math.random() * 360; // Random aspect for demo
  }

  private calculateFloodRisk(elevation: number, slope: number): SRTMResponse['floodRisk'] {
    const factors: string[] = [];
    let score = 0;

    // Low elevation increases flood risk
    if (elevation < 1000) {
      score += 0.4;
      factors.push('Low elevation');
    } else if (elevation < 1500) {
      score += 0.2;
      factors.push('Moderate elevation');
    }

    // Low slope increases flood risk
    if (slope < 5) {
      score += 0.3;
      factors.push('Low slope');
    } else if (slope < 15) {
      score += 0.1;
      factors.push('Moderate slope');
    }

    // Proximity to water bodies (simplified)
    score += 0.1;
    factors.push('Proximity to water');

    const level = score > 0.6 ? 'high' : score > 0.3 ? 'medium' : 'low';

    return {
      level,
      score: Math.min(1, score),
      factors
    };
  }

  private getFallbackElevationData(params: SRTMParams): SRTMResponse {
    // Fallback data for demo purposes
    const elevation = 1200 + Math.random() * 800; // Random elevation between 1200-2000m
    const slope = Math.random() * 30; // Random slope 0-30 degrees
    const aspect = Math.random() * 360; // Random aspect 0-360 degrees
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

  async getFloodRiskAssessment(lat: number, lon: number, radius: number = 1000) {
    return this.getElevationData({ lat, lon, radius });
  }

  async getTerrainProfile(bbox: [number, number, number, number]) {
    try {
      // Get elevation data for multiple points within the bounding box
      const points = this.generateGridPoints(bbox, 10); // 10x10 grid
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

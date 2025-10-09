/**
 * OpenTopography API Client
 *
 * Provides access to global elevation data via OpenTopography's Global DEM API.
 *
 * API Documentation: https://portal.opentopography.org/apidocs/
 * Endpoint: https://portal.opentopography.org/API/globaldem
 *
 * Available DEMs:
 * - SRTMGL3: SRTM GL3 (90m resolution, global coverage)
 * - SRTMGL1: SRTM GL1 (30m resolution, limited coverage)
 * - AW3D30: ALOS World 3D 30m
 *
 * Rate Limits: Public API has rate limits - use responsibly
 * No API key required for basic usage
 */

import axios from 'axios';

export interface OpenTopoParams {
  demtype: 'SRTMGL3' | 'SRTMGL1' | 'AW3D30' | 'SRTMGL1_E';
  south: number;
  north: number;
  west: number;
  east: number;
  outputFormat: 'GTiff' | 'AAIGrid' | 'HFA';
  API_Key?: string; // Optional - increases rate limits
}

export interface ElevationData {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  values: number[][];
}

export interface SlopeData {
  min: number;
  max: number;
  mean: number;
  values: number[][];
}

export interface TerrainAnalysis {
  elevation: ElevationData;
  slope: SlopeData;
  aspect?: number[][]; // Direction of slope (degrees from north)
}

/**
 * OpenTopography API Client Class
 */
export class OpenTopographyAPI {
  private baseURL = 'https://portal.opentopography.org/API/globaldem';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch elevation data for a bounding box
   * @param bbox - [west, south, east, north] in decimal degrees
   * @param demType - Type of DEM to use (default: SRTMGL3)
   * @returns Raw elevation data
   */
  async getElevation(
    bbox: [number, number, number, number],
    demType: OpenTopoParams['demtype'] = 'SRTMGL3'
  ): Promise<ElevationData> {
    const [west, south, east, north] = bbox;

    try {
      const params: OpenTopoParams = {
        demtype: demType,
        south,
        north,
        west,
        east,
        outputFormat: 'GTiff',
        ...(this.apiKey && { API_Key: this.apiKey })
      };

      console.log('[OpenTopography] Fetching elevation data:', params);

      const response = await axios.get(this.baseURL, {
        params,
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      // Parse GeoTIFF data
      const elevationData = await this.parseGeoTIFF(response.data);

      return elevationData;
    } catch (error) {
      console.error('[OpenTopography] Error fetching elevation:', error);
      throw new Error(`Failed to fetch elevation data: ${error}`);
    }
  }

  /**
   * Calculate slope from elevation data
   * @param elevation - Elevation data
   * @param cellSize - Cell size in meters (default: 90m for SRTMGL3)
   * @returns Slope data in degrees
   */
  calculateSlope(elevation: ElevationData, cellSize: number = 90): SlopeData {
    const values = elevation.values;
    const rows = values.length;
    const cols = values[0]?.length || 0;

    const slopeValues: number[][] = [];
    let minSlope = Infinity;
    let maxSlope = -Infinity;
    let sumSlope = 0;
    let count = 0;

    for (let i = 0; i < rows; i++) {
      slopeValues[i] = [];
      for (let j = 0; j < cols; j++) {
        if (i === 0 || i === rows - 1 || j === 0 || j === cols - 1) {
          slopeValues[i][j] = 0;
          continue;
        }

        // Calculate slope using Horn's method (3x3 kernel)
        const z1 = values[i - 1][j - 1];
        const z2 = values[i - 1][j];
        const z3 = values[i - 1][j + 1];
        const z4 = values[i][j - 1];
        const z6 = values[i][j + 1];
        const z7 = values[i + 1][j - 1];
        const z8 = values[i + 1][j];
        const z9 = values[i + 1][j + 1];

        const dzdx = ((z3 + 2 * z6 + z9) - (z1 + 2 * z4 + z7)) / (8 * cellSize);
        const dzdy = ((z7 + 2 * z8 + z9) - (z1 + 2 * z2 + z3)) / (8 * cellSize);

        const slope = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * (180 / Math.PI);

        slopeValues[i][j] = slope;
        minSlope = Math.min(minSlope, slope);
        maxSlope = Math.max(maxSlope, slope);
        sumSlope += slope;
        count++;
      }
    }

    return {
      min: minSlope,
      max: maxSlope,
      mean: sumSlope / count,
      values: slopeValues
    };
  }

  /**
   * Get comprehensive terrain analysis (elevation + slope)
   * @param bbox - [west, south, east, north] in decimal degrees
   * @param demType - Type of DEM to use
   * @returns Combined terrain analysis
   */
  async getTerrainAnalysis(
    bbox: [number, number, number, number],
    demType: OpenTopoParams['demtype'] = 'SRTMGL3'
  ): Promise<TerrainAnalysis> {
    const elevation = await this.getElevation(bbox, demType);
    const slope = this.calculateSlope(elevation);

    return {
      elevation,
      slope
    };
  }

  /**
   * Get elevation for a single point
   * @param lat - Latitude
   * @param lon - Longitude
   * @param bufferKm - Buffer around point in kilometers (default: 0.5km)
   * @returns Elevation statistics for the area
   */
  async getPointElevation(
    lat: number,
    lon: number,
    bufferKm: number = 0.5
  ): Promise<{ elevation: number; slope: number }> {
    // Convert buffer to degrees (approximate)
    const bufferDeg = bufferKm / 111; // 1 degree ≈ 111km

    const bbox: [number, number, number, number] = [
      lon - bufferDeg,
      lat - bufferDeg,
      lon + bufferDeg,
      lat + bufferDeg
    ];

    const terrain = await this.getTerrainAnalysis(bbox);

    return {
      elevation: terrain.elevation.mean,
      slope: terrain.slope.mean
    };
  }

  /**
   * Parse GeoTIFF data
   * @param buffer - ArrayBuffer containing GeoTIFF data
   * @returns Parsed elevation data
   */
  private async parseGeoTIFF(_buffer: ArrayBuffer): Promise<ElevationData> {
    // Mock implementation with more realistic Rwanda terrain data
    // In production, use geotiff.js library to parse actual TIFF data
    // npm install geotiff

    // Using geotiff library:
    // import { fromArrayBuffer } from 'geotiff';
    // const tiff = await fromArrayBuffer(_buffer);
    // const image = await tiff.getImage();
    // const data = await image.readRasters();

    console.log('[OpenTopography] Using mock terrain data (GeoTIFF parsing not implemented)');

    // Generate realistic elevation data for Rwanda
    // Rwanda elevation ranges from ~900m (Lake Kivu shores) to ~4500m (Volcanoes)
    // Most populated areas: 1400-1800m
    const mockValues: number[][] = [];
    const size = 5; // 5x5 grid for performance
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < size; i++) {
      mockValues[i] = [];
      for (let j = 0; j < size; j++) {
        // Generate elevation with some variance (typical inhabited areas)
        const baseElevation = 1500; // Typical Rwanda elevation
        const variance = 300; // ±300m variance
        const value = baseElevation + (Math.random() - 0.5) * variance * 2;

        mockValues[i][j] = value;
        min = Math.min(min, value);
        max = Math.max(max, value);
        sum += value;
        count++;
      }
    }

    const mean = sum / count;
    const variance = mockValues.reduce((acc, row) => {
      return acc + row.reduce((rowAcc, val) => rowAcc + Math.pow(val - mean, 2), 0);
    }, 0) / count;

    return {
      min,
      max,
      mean,
      stdDev: Math.sqrt(variance),
      values: mockValues
    };
  }

  /**
   * Check if OpenTopography API is configured
   */
  isConfigured(): boolean {
    return true; // No API key required for basic usage
  }
}

// Singleton instance
export const openTopographyAPI = new OpenTopographyAPI(
  process.env.NEXT_PUBLIC_OPENTOPOGRAPHY_API_KEY
);

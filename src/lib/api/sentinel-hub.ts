import axios from 'axios';
import type { SentinelHubParams, NDVIResponse } from '@/types';

// Environment variables for Sentinel Hub configuration
const SENTINEL_HUB_INSTANCE_ID = process.env.NEXT_PUBLIC_SENTINEL_HUB_INSTANCE_ID;
const SENTINEL_CLIENT_ID = process.env.NEXT_PUBLIC_SENTINEL_CLIENT_ID;
const SENTINEL_CLIENT_SECRET = process.env.NEXT_PUBLIC_SENTINEL_CLIENT_SECRET;

// Pre-configured layer IDs (optional - for WMTS approach)
const SENTINEL_NDVI_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_NDVI_LAYER_ID;
const SENTINEL_FLOOD_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_FLOOD_LAYER_ID;
const SENTINEL_MOISTURE_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_MOISTURE_LAYER_ID;
const SENTINEL_NDWI_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_NDWI_LAYER_ID;
const SENTINEL_FALSE_COLOR_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_FALSE_COLOR_LAYER_ID;

/**
 * Sentinel Hub API Client
 * 
 * EVALSCRIPTS DOCUMENTATION:
 * 
 * 1. NDVI (Sentinel-2 L2A): (B08 - B04) / (B08 + B04)
 *    - Color: Red (stressed) → Green (healthy vegetation)
 *    - Range: -1 to 1, typical: 0.1-0.8
 * 
 * 2. Moisture Index/MSI (Sentinel-2 L2A): (B8A - B11) / (B8A + B11)
 *    - Color: Red (dry) → Green (wet)
 *    - Range: -1 to 1, higher values = drier soil
 * 
 * 3. NDWI (Sentinel-2 L2A): (B03 - B08) / (B03 + B08)
 *    - Color: Blue (water) → Brown (land)
 *    - Range: -1 to 1, higher values = more water
 * 
 * 4. Flood Detection (Sentinel-1 GRD): 1.5 * (VV - VH)
 *    - Color: Blue (flooded) → Gray (land)
 *    - Uses VV/VH backscatter difference
 * 
 * 5. False Color (Sentinel-2 L2A): NIR-Red-Green composite
 *    - Color: Red (vegetation), Blue (urban), Green (water)
 *    - Bands: B08 (NIR), B04 (Red), B03 (Green)
 */
export class SentinelHubAPI {
  private instanceId: string;
  private clientId: string;
  private clientSecret: string;
  private ndviLayerId: string;
  private floodLayerId: string;
  private moistureLayerId: string;
  private ndwiLayerId: string;
  private falseColorLayerId: string;
  private baseURL = 'https://services.sentinel-hub.com/api/v1';

  constructor() {
    this.instanceId = SENTINEL_HUB_INSTANCE_ID || '';
    this.clientId = SENTINEL_CLIENT_ID || '';
    this.clientSecret = SENTINEL_CLIENT_SECRET || '';
    this.ndviLayerId = SENTINEL_NDVI_LAYER_ID || '';
    this.floodLayerId = SENTINEL_FLOOD_LAYER_ID || '';
    this.moistureLayerId = SENTINEL_MOISTURE_LAYER_ID || '';
    this.ndwiLayerId = SENTINEL_NDWI_LAYER_ID || '';
    this.falseColorLayerId = SENTINEL_FALSE_COLOR_LAYER_ID || '';
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      // Use proxy to avoid CORS issues
      const response = await axios.post('/api/proxy/sentinel-hub', {
        action: 'token'
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Sentinel Hub Auth Error:', error);
      return null;
    }
  }

  /**
   * Reusable method to process satellite data using Sentinel Hub Process API
   * @param dataset - Dataset name (e.g., 'sentinel-2-l2a', 'sentinel-1-grd')
   * @param bbox - Bounding box [minLon, minLat, maxLon, maxLat]
   * @param evalscript - JavaScript code for data processing
   * @param timeRange - Time range in format 'YYYY-MM-DD/YYYY-MM-DD'
   * @param width - Output width (default: 512)
   * @param height - Output height (default: 512)
   */
  private async processRequest(
    dataset: string,
    bbox: number[],
    evalscript: string,
    timeRange: string = '2023-01-01/2024-12-31',
    width: number = 512,
    height: number = 512
  ): Promise<any> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('Failed to get access token');
      }

      const requestBody = {
        input: {
          bounds: {
            bbox: bbox,
            properties: {
              crs: 'http://www.opengis.net/def/crs/EPSG/0/4326'
            }
          },
          data: [
            {
              type: dataset,
              dataFilter: {
                timeRange: {
                  from: timeRange.split('/')[0],
                  to: timeRange.split('/')[1]
                }
              }
            }
          ]
        },
        output: {
          width: width,
          height: height,
          responses: [
            {
              identifier: 'default',
              format: {
                type: 'image/png'
              }
            }
          ]
        },
        evalscript: evalscript
      };

      // Use proxy to avoid CORS issues
      const response = await axios.post('/api/proxy/sentinel-hub', {
        action: 'process',
        token,
        requestBody
      }, {
        timeout: 60000
      });

      return response.data;
    } catch (error) {
      console.error('Sentinel Hub Process API Error:', error);
      throw error;
    }
  }

  // =============================================================================
  // PROCESS API METHODS (for dynamic data processing)
  // =============================================================================

  /**
   * Get NDVI (Normalized Difference Vegetation Index) data
   * Uses Sentinel-2 L2A bands B08 (NIR) and B04 (Red)
   * Formula: (B08 - B04) / (B08 + B04)
   */
  async getNDVIData(bbox: number[], timeRange?: string): Promise<any> {
    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B04", "B08", "dataMask"],
          output: { bands: 4 }
        };
      }

      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);

        // Color mapping for NDVI values
        // Red: stressed vegetation, Green: healthy vegetation
        let r, g, b;
        if (ndvi < 0.1) {
          r = 0.8; g = 0.2; b = 0.2; // Red for stressed
        } else if (ndvi < 0.3) {
          r = 1.0; g = 0.8; b = 0.2; // Yellow-orange
        } else if (ndvi < 0.6) {
          r = 0.2; g = 0.8; b = 0.2; // Light green
        } else {
          r = 0.0; g = 0.5; b = 0.0; // Dark green for healthy
        }

        return [r, g, b, sample.dataMask];
      }
    `;

    return this.processRequest('sentinel-2-l2a', bbox, evalscript, timeRange);
  }

  /**
   * Get Moisture Index (MSI) data
   * Uses Sentinel-2 L2A bands B8A (NIR) and B11 (SWIR)
   * Formula: (B8A - B11) / (B8A + B11)
   */
  async getMoistureIndexData(bbox: number[], timeRange?: string): Promise<any> {
    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B8A", "B11", "dataMask"],
          output: { bands: 4 }
        };
      }

      function evaluatePixel(sample) {
        let moisture = (sample.B8A - sample.B11) / (sample.B8A + sample.B11);

        // Color mapping for moisture values
        // Red: dry areas, Green: wet areas
        let r, g, b;
        if (moisture > 0.3) {
          r = 1.0; g = 0.2; b = 0.2; // Red for dry
        } else if (moisture > 0.1) {
          r = 1.0; g = 0.8; b = 0.2; // Yellow-orange
        } else if (moisture > -0.1) {
          r = 0.4; g = 0.8; b = 0.2; // Light green
        } else {
          r = 0.0; g = 0.5; b = 0.0; // Dark green for wet
        }

        return [r, g, b, sample.dataMask];
      }
    `;

    return this.processRequest('sentinel-2-l2a', bbox, evalscript, timeRange);
  }

  /**
   * Get NDWI (Normalized Difference Water Index) data
   * Uses Sentinel-2 L2A bands B03 (Green) and B08 (NIR)
   * Formula: (B03 - B08) / (B03 + B08)
   */
  async getNDWIData(bbox: number[], timeRange?: string): Promise<any> {
    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B03", "B08", "dataMask"],
          output: { bands: 4 }
        };
      }

      function evaluatePixel(sample) {
        let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);

        // Color mapping for NDWI values
        // Blue: water bodies, Brown: land areas
        let r, g, b;
        if (ndwi > 0.3) {
          r = 0.0; g = 0.3; b = 1.0; // Blue for water
        } else if (ndwi > 0.1) {
          r = 0.2; g = 0.6; b = 0.8; // Light blue
        } else if (ndwi > -0.1) {
          r = 0.4; g = 0.7; b = 0.4; // Light green
        } else {
          r = 0.6; g = 0.4; b = 0.2; // Brown for land
        }

        return [r, g, b, sample.dataMask];
      }
    `;

    return this.processRequest('sentinel-2-l2a', bbox, evalscript, timeRange);
  }

  /**
   * Get Flood Detection data using Sentinel-1 SAR
   * Uses Sentinel-1 GRD bands VV and VH
   * Formula: 1.5 * (VV - VH)
   */
  async getFloodDetectionData(bbox: number[], timeRange?: string): Promise<any> {
    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["VV", "VH", "dataMask"],
          output: { bands: 4 }
        };
      }

      function evaluatePixel(sample) {
        // Flood detection using VV/VH backscatter difference
        let floodIndex = 1.5 * (sample.VV - sample.VH);
        
        // Color mapping for flood detection
        // Blue: flooded areas, Gray: land areas
        let r, g, b;
        if (floodIndex < -0.1) {
          r = 0.0; g = 0.3; b = 1.0; // Blue for flood
        } else if (floodIndex < 0.1) {
          r = 0.2; g = 0.6; b = 0.8; // Light blue
        } else {
          r = 0.4; g = 0.4; b = 0.4; // Gray for land
        }

        return [r, g, b, sample.dataMask];
      }
    `;

    return this.processRequest('sentinel-1-grd', bbox, evalscript, timeRange);
  }

  /**
   * Get False Color Agriculture data
   * Uses Sentinel-2 L2A bands B08 (NIR), B04 (Red), B03 (Green)
   * NIR-Red-Green composite for enhanced vegetation visualization
   */
  async getFalseColorData(bbox: number[], timeRange?: string): Promise<any> {
    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B08", "B04", "B03", "dataMask"],
          output: { bands: 4 }
        };
      }

      function evaluatePixel(sample) {
        // False color composite: NIR-Red-Green
        // Scale values to 0-1 range
        let r = sample.B08 / 10000; // NIR -> Red
        let g = sample.B04 / 10000; // Red -> Green  
        let b = sample.B03 / 10000; // Green -> Blue

        // Apply contrast enhancement
        r = Math.min(1, Math.max(0, r * 2));
        g = Math.min(1, Math.max(0, g * 2));
        b = Math.min(1, Math.max(0, b * 2));

        return [r, g, b, sample.dataMask];
      }
    `;

    return this.processRequest('sentinel-2-l2a', bbox, evalscript, timeRange);
  }

  // =============================================================================
  // WMTS TILE URL METHODS (for pre-configured layers)
  // =============================================================================

  /**
   * Get WMTS tile URL for NDVI layer (pre-configured)
   * Requires NEXT_PUBLIC_SENTINEL_NDVI_LAYER_ID in environment
   */
  getNDVITileURL(): string {
    if (!this.instanceId || !this.ndviLayerId) {
      console.warn('NDVI layer not configured. Please set NEXT_PUBLIC_SENTINEL_NDVI_LAYER_ID');
      return '';
    }

    const wmtsBaseURL = 'https://services.sentinel-hub.com/ogc/wmts';
    return `${wmtsBaseURL}/${this.instanceId}?layer=${this.ndviLayerId}&tilematrixset=PopularWebMercator256&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}&time=2023-01-01/2024-12-31`;
  }

  /**
   * Get WMTS tile URL for Moisture Index layer (pre-configured)
   * Requires NEXT_PUBLIC_SENTINEL_MOISTURE_LAYER_ID in environment
   */
  getMoistureIndexTileURL(): string {
    if (!this.instanceId || !this.moistureLayerId) {
      console.warn('Moisture Index layer not configured. Please set NEXT_PUBLIC_SENTINEL_MOISTURE_LAYER_ID');
      return '';
    }

    const wmtsBaseURL = 'https://services.sentinel-hub.com/ogc/wmts';
    return `${wmtsBaseURL}/${this.instanceId}?layer=${this.moistureLayerId}&tilematrixset=PopularWebMercator256&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}&time=2023-01-01/2024-12-31`;
  }

  /**
   * Get WMTS tile URL for NDWI layer (pre-configured)
   * Requires NEXT_PUBLIC_SENTINEL_NDWI_LAYER_ID in environment
   */
  getNDWITileURL(): string {
    if (!this.instanceId || !this.ndwiLayerId) {
      console.warn('NDWI layer not configured. Please set NEXT_PUBLIC_SENTINEL_NDWI_LAYER_ID');
      return '';
    }

    const wmtsBaseURL = 'https://services.sentinel-hub.com/ogc/wmts';
    return `${wmtsBaseURL}/${this.instanceId}?layer=${this.ndwiLayerId}&tilematrixset=PopularWebMercator256&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}&time=2023-01-01/2024-12-31`;
  }

  /**
   * Get WMTS tile URL for Flood Detection layer (pre-configured)
   * Requires NEXT_PUBLIC_SENTINEL_FLOOD_LAYER_ID in environment
   */
  getFloodTileURL(): string {
    if (!this.instanceId || !this.floodLayerId) {
      console.warn('Flood Detection layer not configured. Please set NEXT_PUBLIC_SENTINEL_FLOOD_LAYER_ID');
      return '';
    }

    const wmtsBaseURL = 'https://services.sentinel-hub.com/ogc/wmts';
    return `${wmtsBaseURL}/${this.instanceId}?layer=${this.floodLayerId}&tilematrixset=PopularWebMercator256&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}&time=2023-01-01/2024-12-31`;
  }

  /**
   * Get WMTS tile URL for False Color layer (pre-configured)
   * Requires NEXT_PUBLIC_SENTINEL_FALSE_COLOR_LAYER_ID in environment
   */
  getFalseColorTileURL(): string {
    if (!this.instanceId || !this.falseColorLayerId) {
      console.warn('False Color layer not configured. Please set NEXT_PUBLIC_SENTINEL_FALSE_COLOR_LAYER_ID');
      return '';
    }

    const wmtsBaseURL = 'https://services.sentinel-hub.com/ogc/wmts';
    return `${wmtsBaseURL}/${this.instanceId}?layer=${this.falseColorLayerId}&tilematrixset=PopularWebMercator256&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}&time=2023-01-01/2024-12-31`;
  }

  // =============================================================================
  // CONFIGURATION CHECK METHODS
  // =============================================================================

  /**
   * Check if Sentinel Hub is properly configured
   */
  isConfigured(): boolean {
    return !!(this.instanceId && this.clientId && this.clientSecret);
  }

  /**
   * Check if specific layer is configured
   */
  isLayerConfigured(layerId: string): boolean {
    switch (layerId) {
      case 'ndvi':
        return !!(this.instanceId && this.ndviLayerId);
      case 'moisture':
        return !!(this.instanceId && this.moistureLayerId);
      case 'ndwi':
        return !!(this.instanceId && this.ndwiLayerId);
      case 'flood':
        return !!(this.instanceId && this.floodLayerId);
      case 'false-color':
        return !!(this.instanceId && this.falseColorLayerId);
      default:
        return false;
    }
  }

  // =============================================================================
  // LEGACY COMPATIBILITY METHODS
  // =============================================================================

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getNDVIData() instead
   */
  async getVegetationHealth(bbox: [number, number, number, number], time: string) {
    return this.getNDVIData(bbox, time);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getNDVITileURL() instead
   */
  getXYZTileURL(): string {
    return this.getNDVITileURL();
  }
}

export const sentinelHubAPI = new SentinelHubAPI();

/**
 * =============================================================================
 * DOCUMENTATION
 * =============================================================================
 * 
 * API USAGE:
 * 
 * 1. PROCESS API (Dynamic Processing):
 *    - Use for real-time data processing with custom evalscripts
 *    - Requires authentication token
 *    - Slower but more flexible
 *    - Example: const result = await sentinelHubAPI.getMoistureIndexData([-2, 29, -1.5, 30]);
 * 
 * 2. WMTS API (Pre-configured Layers):
 *    - Use for pre-configured layers in Sentinel Hub dashboard
 *    - Faster tile serving
 *    - Requires layer IDs in environment variables
 *    - Example: const tileURL = sentinelHubAPI.getNDVITileURL();
 * 
 * ENVIRONMENT SETUP:
 * 
 * Required:
 * - NEXT_PUBLIC_SENTINEL_HUB_INSTANCE_ID
 * - NEXT_PUBLIC_SENTINEL_CLIENT_ID  
 * - NEXT_PUBLIC_SENTINEL_CLIENT_SECRET
 * 
 * Optional (for WMTS):
 * - NEXT_PUBLIC_SENTINEL_NDVI_LAYER_ID
 * - NEXT_PUBLIC_SENTINEL_MOISTURE_LAYER_ID
 * - NEXT_PUBLIC_SENTINEL_NDWI_LAYER_ID
 * - NEXT_PUBLIC_SENTINEL_FLOOD_LAYER_ID
 * - NEXT_PUBLIC_SENTINEL_FALSE_COLOR_LAYER_ID
 * 
 * SENTINEL HUB DASHBOARD SETUP:
 * 
 * 1. Go to https://apps.sentinel-hub.com/dashboard/#/configurations
 * 2. Create new configuration for each layer
 * 3. Add the evalscript from the documentation above
 * 4. Copy the layer ID to your .env.local file
 * 
 * LAYER SPECIFICATIONS:
 * 
 * - NDVI: Sentinel-2 L2A, bands B08, B04
 * - Moisture Index: Sentinel-2 L2A, bands B8A, B11  
 * - NDWI: Sentinel-2 L2A, bands B03, B08
 * - Flood Detection: Sentinel-1 GRD, bands VV, VH
 * - False Color: Sentinel-2 L2A, bands B08, B04, B03
 * 
 * =============================================================================
 */
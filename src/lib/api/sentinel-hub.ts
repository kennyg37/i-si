import axios from 'axios';
import type { SentinelHubParams, NDVIResponse } from '@/types';

const SENTINEL_HUB_INSTANCE_ID = process.env.NEXT_PUBLIC_SENTINEL_HUB_INSTANCE_ID;
const SENTINEL_CLIENT_ID = process.env.NEXT_PUBLIC_SENTINEL_CLIENT_ID;
const SENTINEL_CLIENT_SECRET = process.env.NEXT_PUBLIC_SENTINEL_CLIENT_SECRET;
const SENTINEL_NDVI_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_NDVI_LAYER_ID;
const SENTINEL_FLOOD_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_FLOOD_LAYER_ID;
const SENTINEL_MOISTURE_LAYER_ID = process.env.NEXT_PUBLIC_SENTINEL_MOISTURE_LAYER_ID;

export class SentinelHubAPI {
  private instanceId: string;
  private clientId: string;
  private clientSecret: string;
  private ndviLayerId: string;
  private floodLayerId: string;
  private moistureLayerId: string;
  private baseURL = 'https://services.sentinel-hub.com/api/v1';

  constructor() {
    this.instanceId = SENTINEL_HUB_INSTANCE_ID || '';
    this.clientId = SENTINEL_CLIENT_ID || '';
    this.clientSecret = SENTINEL_CLIENT_SECRET || '';
    this.ndviLayerId = SENTINEL_NDVI_LAYER_ID || '';
    this.floodLayerId = SENTINEL_FLOOD_LAYER_ID || '';
    this.moistureLayerId = SENTINEL_MOISTURE_LAYER_ID || '';
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

  async getNDVIData(params: SentinelHubParams): Promise<NDVIResponse | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const evalscript = `
        //VERSION=3
        function setup() {
          return {
            input: ["B02", "B03", "B04", "B08", "dataMask"],
            output: { bands: 4 }
          };
        }

        function evaluatePixel(sample) {
          let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
          let evi = 2.5 * (sample.B08 - sample.B04) / (sample.B08 + 6 * sample.B04 - 7.5 * sample.B03 + 1);
          
          return [ndvi, evi, sample.B08, sample.B04];
        }
      `;

      // Use proxy to avoid CORS issues
      const response = await axios.post(
        '/api/proxy/sentinel-hub',
        {
          action: 'process',
          token,
          requestBody: {
            input: {
              bounds: {
                bbox: params.bbox,
                properties: {
                  crs: 'http://www.opengis.net/def/crs/EPSG/0/4326'
                }
              },
              data: [
                {
                  type: 'sentinel-2-l2a',
                  dataFilter: {
                    timeRange: {
                      from: params.time.split('/')[0],
                      to: params.time.split('/')[1]
                    }
                  }
                }
              ]
            },
            output: {
              width: params.width,
              height: params.height,
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
          }
        },
        {
          timeout: 60000
        }
      );

      return response.data;
    } catch (error) {
      console.error('Sentinel Hub API Error:', error);
      return null;
    }
  }

  async getVegetationHealth(bbox: [number, number, number, number], time: string) {
    return this.getNDVIData({
      bbox,
      time,
      width: 512,
      height: 512,
      format: 'application/json'
    });
  }

  /**
   * Get WMS tile URL for NDVI visualization
   * This generates a tile URL that can be used directly in Mapbox as a raster source
   */
  getWMSTileURL(): string {
    // Sentinel Hub WMS endpoint
    const wmsBaseURL = 'https://services.sentinel-hub.com/ogc/wms';

    // NDVI evalscript for visualization
    const evalscript = encodeURIComponent(`
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
        // Red: -1 to 0 (water, bare soil)
        // Yellow: 0 to 0.2 (sparse vegetation)
        // Green: 0.2 to 0.5 (moderate vegetation)
        // Dark Green: 0.5 to 1 (dense vegetation)

        let r, g, b;
        if (ndvi < 0) {
          r = 0.5; g = 0.5; b = 1.0; // Blue for water
        } else if (ndvi < 0.2) {
          r = 1.0; g = 0.8; b = 0.4; // Yellow-orange
        } else if (ndvi < 0.5) {
          r = 0.4; g = 0.8; b = 0.2; // Light green
        } else {
          r = 0.0; g = 0.5; b = 0.0; // Dark green
        }

        return [r, g, b, sample.dataMask];
      }
    `);

    // WMS parameters
    const params = new URLSearchParams({
      service: 'WMS',
      request: 'GetMap',
      layers: 'TRUE-COLOR-S2L2A',
      styles: '',
      format: 'image/png',
      transparent: 'true',
      version: '1.3.0',
      width: '256',
      height: '256',
      crs: 'EPSG:3857',
      bbox: '{bbox-epsg-3857}',
      time: '2023-01-01/2024-12-31', // Last 2 years
      maxcc: '20', // Max cloud coverage 20%
      evalscript: evalscript
    });

    return `${wmsBaseURL}/${this.instanceId}?${params.toString()}`;
  }

  /**
   * Get tile URL template for Mapbox using WMTS
   * Requires a pre-configured layer in Sentinel Hub dashboard
   */
  getXYZTileURL(): string {
    if (!this.instanceId) {
      console.warn('Sentinel Hub Instance ID not configured');
      return '';
    }

    if (!this.ndviLayerId) {
      console.warn('Sentinel Hub NDVI Layer ID not configured. Please create a layer at https://apps.sentinel-hub.com/dashboard/#/configurations');
      return '';
    }

    // WMTS endpoint with configured layer
    const wmtsBaseURL = 'https://services.sentinel-hub.com/ogc/wmts';

    return `${wmtsBaseURL}/${this.instanceId}?layer=${this.ndviLayerId}&tilematrixset=PopularWebMercator256&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}&time=2023-01-01/2024-12-31`;
  }

  /**
   * Get tile URL for Sentinel-1 SAR flood detection layer
   * Note: Sentinel-1 has stricter resolution limits (1500m/pixel max)
   */
  getFloodTileURL(): string {
    if (!this.instanceId) {
      console.warn('Sentinel Hub Instance ID not configured');
      return '';
    }

    if (!this.floodLayerId) {
      console.warn('Sentinel Hub Flood Layer ID not configured. Please create a Sentinel-1 SAR layer at https://apps.sentinel-hub.com/dashboard/#/configurations');
      return '';
    }

    const wmsBaseURL = 'https://services.sentinel-hub.com/ogc/wms';

    // Use last 30 days for recent flood detection
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // WMS GetMap request with bbox template for XYZ tiles
    // Using larger dimensions (512x512) to meet Sentinel-1 resolution requirements
    const params = new URLSearchParams({
      service: 'WMS',
      request: 'GetMap',
      layers: this.floodLayerId,
      styles: '',
      format: 'image/png',
      transparent: 'true',
      version: '1.3.0',
      width: '512',
      height: '512',
      crs: 'EPSG:3857',
      time: `${startDate}/${endDate}`,
    });

    // Note: bbox will be replaced by Mapbox with actual tile bounds
    return `${wmsBaseURL}/${this.instanceId}?${params.toString()}&bbox={bbox-epsg-3857}`;
  }

  /**
   * Check if Sentinel Hub is properly configured
   */
  isConfigured(): boolean {
    return !!(this.instanceId && this.clientId && this.clientSecret && this.ndviLayerId);
  }

  /**
   * Check if flood layer is configured
   */
  isFloodConfigured(): boolean {
    return !!(this.instanceId && this.clientId && this.clientSecret && this.floodLayerId);
  }

  /**
   * Get tile URL for Sentinel-2 Moisture Stress Index (MSI) layer
   * Useful for drought monitoring and agricultural disaster prevention
   * MSI = (SWIR1 - NIR) / (SWIR1 + NIR) using bands B11 and B8A
   */
  getMoistureTileURL(): string {
    if (!this.instanceId) {
      console.warn('Sentinel Hub Instance ID not configured');
      return '';
    }

    if (!this.moistureLayerId) {
      console.warn('Sentinel Hub Moisture Layer ID not configured. Please create a Sentinel-2 layer at https://apps.sentinel-hub.com/dashboard/#/configurations');
      return '';
    }

    const wmtsBaseURL = 'https://services.sentinel-hub.com/ogc/wmts';

    return `${wmtsBaseURL}/${this.instanceId}?layer=${this.moistureLayerId}&tilematrixset=PopularWebMercator256&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}&time=2023-01-01/2024-12-31`;
  }

  /**
   * Check if moisture layer is configured
   */
  isMoistureConfigured(): boolean {
    return !!(this.instanceId && this.clientId && this.clientSecret && this.moistureLayerId);
  }
}

export const sentinelHubAPI = new SentinelHubAPI();

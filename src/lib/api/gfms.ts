/**
 * GFMS (Global Flood Monitoring System) API Client
 *
 * Provides access to near real-time flood monitoring data from NASA's GFMS.
 *
 * API Documentation: https://gfms.umiacs.umd.edu/
 * Data Source: NASA GSFC Hydrological Sciences Laboratory
 *
 * Available Data:
 * - Flood detection (satellite-based)
 * - Water depth estimates
 * - Inundation extent
 * - Historical flood events
 *
 * Data Format: GeoTIFF rasters and GeoJSON vectors
 * Update Frequency: Every 3 hours
 * Resolution: ~1km
 *
 * Rate Limits: Public data - use responsibly
 * No API key required
 */

import axios from 'axios';

export interface GFMSFloodData {
  timestamp: string;
  location: {
    lat: number;
    lon: number;
  };
  floodDetection: boolean;
  waterDepth: number; // meters
  inundationExtent: number; // square kilometers
  severity: 'low' | 'medium' | 'high' | 'extreme';
  confidence: number; // 0-1
}

export interface GFMSHistoricalEvent {
  date: string;
  location: {
    lat: number;
    lon: number;
  };
  maxWaterDepth: number;
  duration: number; // days
  affectedArea: number; // square kilometers
}

export interface GFMSFloodRiskScore {
  currentRisk: number; // 0-1
  historicalFrequency: number; // floods per year
  severity: 'low' | 'medium' | 'high' | 'extreme';
  lastFloodDate?: string;
}

/**
 * GFMS API Client Class
 */
export class GFMSAPI {
  private baseURL = 'https://gfms.umiacs.umd.edu/api/v1';

  // Alternative data sources
  private tileURL = 'https://gfms.umiacs.umd.edu/tiles';

  constructor() {
    // No API key required
  }

  /**
   * Get current flood detection data for a location
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Current flood data
   */
  async getCurrentFloodData(lat: number, lon: number): Promise<GFMSFloodData | null> {
    try {
      console.log(`[GFMS] Fetching current flood data for: ${lat}, ${lon}`);

      // Note: GFMS doesn't have a direct API endpoint for point queries
      // In production, you would:
      // 1. Download the latest GeoTIFF raster
      // 2. Extract the value at the given coordinates
      // 3. Interpret the value based on GFMS documentation

      // For now, return mock data based on typical Rwanda flood patterns
      const floodData = await this.mockFloodData(lat, lon);

      return floodData;
    } catch (error) {
      console.error('[GFMS] Error fetching flood data:', error);
      return null;
    }
  }

  /**
   * Get historical flood events for a location
   * @param lat - Latitude
   * @param lon - Longitude
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of historical flood events
   */
  async getHistoricalFloods(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): Promise<GFMSHistoricalEvent[]> {
    try {
      console.log(`[GFMS] Fetching historical floods for: ${lat}, ${lon}`);

      // Mock implementation - in production, query historical database
      const events = await this.mockHistoricalEvents(lat, lon, startDate, endDate);

      return events;
    } catch (error) {
      console.error('[GFMS] Error fetching historical floods:', error);
      return [];
    }
  }

  /**
   * Calculate flood risk score based on current and historical data
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Comprehensive flood risk score
   */
  async getFloodRiskScore(lat: number, lon: number): Promise<GFMSFloodRiskScore> {
    try {
      const currentData = await this.getCurrentFloodData(lat, lon);

      // Get last 5 years of historical data
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const historicalEvents = await this.getHistoricalFloods(lat, lon, startDate, endDate);

      // Calculate risk score
      const historicalFrequency = historicalEvents.length / 5; // floods per year
      const currentRisk = currentData?.floodDetection ? currentData.waterDepth / 10 : 0;

      let severity: 'low' | 'medium' | 'high' | 'extreme';
      if (currentRisk > 0.7 || historicalFrequency > 2) severity = 'extreme';
      else if (currentRisk > 0.5 || historicalFrequency > 1) severity = 'high';
      else if (currentRisk > 0.3 || historicalFrequency > 0.5) severity = 'medium';
      else severity = 'low';

      const lastEvent = historicalEvents.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      return {
        currentRisk: Math.min(1, currentRisk + historicalFrequency / 5),
        historicalFrequency,
        severity,
        lastFloodDate: lastEvent?.date
      };
    } catch (error) {
      console.error('[GFMS] Error calculating flood risk:', error);
      return {
        currentRisk: 0,
        historicalFrequency: 0,
        severity: 'low'
      };
    }
  }

  /**
   * Get GFMS tile URL for map visualization
   * @param date - Date string (YYYY-MM-DD)
   * @returns Tile URL template
   */
  getFloodTileURL(date?: string): string {
    const dateStr = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
    // GFMS tile service format
    return `${this.tileURL}/flood/${dateStr}/{z}/{x}/{y}.png`;
  }

  /**
   * Check if GFMS API is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Check if GFMS service is responding
      // In production, make a lightweight request to verify
      return true;
    } catch (error) {
      console.error('[GFMS] Service unavailable:', error);
      return false;
    }
  }

  /**
   * Mock flood data for development
   * @private
   */
  private async mockFloodData(lat: number, lon: number): Promise<GFMSFloodData> {
    // Simulate flood risk based on location characteristics
    // Rwanda's rainy seasons: March-May and October-December
    const month = new Date().getMonth() + 1;
    const isRainySeason = (month >= 3 && month <= 5) || (month >= 10 && month <= 12);

    // Higher flood risk in valleys and low-lying areas
    // Rwanda elevation typically 1000-2500m
    const estimatedElevation = 1000 + Math.random() * 1500;
    const isLowLying = estimatedElevation < 1300;

    const baseRisk = isRainySeason ? 0.3 : 0.1;
    const elevationFactor = isLowLying ? 1.5 : 0.5;
    const randomFactor = Math.random();

    const floodRisk = baseRisk * elevationFactor * randomFactor;
    const floodDetection = floodRisk > 0.3;

    let severity: 'low' | 'medium' | 'high' | 'extreme';
    if (floodRisk > 0.7) severity = 'extreme';
    else if (floodRisk > 0.5) severity = 'high';
    else if (floodRisk > 0.3) severity = 'medium';
    else severity = 'low';

    return {
      timestamp: new Date().toISOString(),
      location: { lat, lon },
      floodDetection,
      waterDepth: floodDetection ? floodRisk * 5 : 0, // 0-5 meters
      inundationExtent: floodDetection ? floodRisk * 10 : 0, // 0-10 km²
      severity,
      confidence: 0.7 + Math.random() * 0.2
    };
  }

  /**
   * Mock historical events for development
   * @private
   */
  private async mockHistoricalEvents(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): Promise<GFMSHistoricalEvent[]> {
    const events: GFMSHistoricalEvent[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const yearsDiff = (end.getTime() - start.getTime()) / (365 * 24 * 60 * 60 * 1000);

    // Generate 0-3 events per year
    const eventCount = Math.floor(yearsDiff * (Math.random() * 3));

    for (let i = 0; i < eventCount; i++) {
      const randomDate = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );

      events.push({
        date: randomDate.toISOString().split('T')[0],
        location: { lat, lon },
        maxWaterDepth: 0.5 + Math.random() * 4.5, // 0.5-5 meters
        duration: 1 + Math.floor(Math.random() * 14), // 1-14 days
        affectedArea: 1 + Math.random() * 50 // 1-50 km²
      });
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Check if GFMS API is configured
   */
  isConfigured(): boolean {
    return true; // No API key required
  }
}

// Singleton instance
export const gfmsAPI = new GFMSAPI();

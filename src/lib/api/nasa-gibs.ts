/**
 * NASA GIBS (Global Imagery Browse Services) API Client
 * 
 * This client provides access to NASA's pre-rendered satellite imagery tiles
 * for various environmental monitoring applications including flood detection,
 * drought monitoring, soil moisture, and land surface temperature analysis.
 * 
 * USAGE WITH MAPBOX:
 * ```typescript
 * import { NasaGibsClient } from '@/lib/api/nasa-gibs';
 * 
 * const gibs = new NasaGibsClient();
 * 
 * // Add flood detection layer to Mapbox
 * map.addSource('nasa-flood', {
 *   type: 'raster',
 *   tiles: [gibs.getFloodTileURL('viirs')],
 *   tileSize: 256
 * });
 * 
 * map.addLayer({
 *   id: 'nasa-flood-layer',
 *   type: 'raster',
 *   source: 'nasa-flood',
 *   paint: { 'raster-opacity': 0.7 }
 * });
 * ```
 * 
 * USAGE WITH LEAFLET:
 * ```typescript
 * const floodLayer = L.tileLayer(gibs.getFloodTileURL('viirs'), {
 *   attribution: 'NASA GIBS'
 * });
 * floodLayer.addTo(map);
 * ```
 * 
 * EARTHDATA CREDENTIALS:
 * While GIBS tiles are free, you may need Earthdata credentials for:
 * - Raw data downloads
 * - Metadata queries
 * - Higher resolution imagery
 * 
 * Get credentials at: https://urs.earthdata.nasa.gov/
 */

import axios from 'axios';

/**
 * Layer information interface
 */
export interface LayerInfo {
  name: string;
  description: string;
  source: string;
  updateFrequency: string;
  idealZoomLevels: string;
  resolution: string;
  dataType: string;
  useCase: string;
  layerId: string;
}

/**
 * Centralized mapping of all available GIBS layers
 * Keys are short, consistent identifiers for easy access
 * IMPORTANT: These are the EXACT layer identifiers from NASA GIBS
 * Browse available layers at: https://worldview.earthdata.nasa.gov/
 */
export const GIBS_LAYERS = {
  // 🌊 Flood Detection Layers
  flood_viirs_1day: 'VIIRS_Combined_Flood_1-Day',
  flood_viirs_2day: 'VIIRS_Combined_Flood_2-Day',
  flood_viirs_3day: 'VIIRS_Combined_Flood_3-Day',
  flood_modis_1day: 'MODIS_Combined_Flood_1-Day',
  flood_modis_2day: 'MODIS_Combined_Flood_2-Day',
  flood_modis_3day: 'MODIS_Combined_Flood_3-Day',

  // 🌱 Soil Moisture Layers
  // SMAP provides surface and root zone soil moisture (daily and 3-hourly)
  soil_moisture: 'SMAP_L3_Active_Soil_Moisture', // Valid GIBS layer
  soil_moisture_anomaly: 'SMAP_L4_Analyzed_Surface_Soil_Moisture', // Valid anomaly layer

  // 🌧️ Rainfall and Precipitation
  rainfall_anomaly: 'GLDAS_Surface_Total_Precipitation_Rate_Monthly', // Monthly anomaly-like use
  precipitation: 'MERRA2_Precipitation_Bias_Corrected_Monthly', // Daily precipitation rate

  // 🌡️ Land Surface Temperature
  land_temp_modis: 'MODIS_Terra_L3_Land_Surface_Temp_8Day_Day_TES',
  land_temp_viirs: 'VIIRS_SNPP_Land_Surface_Temp_Day',

  // 🌿 Drought and Vegetation
  ndvi_modis: 'MODIS_Terra_L3_NDVI_Monthly',
  evi_modis: 'MODIS_Terra_L3_EVI_Monthly',

  // 💧 Water and Hydrology
  water_mask_modis: 'MODIS_Terra_L3_Land_Water_Mask',
  snow_cover: 'MODIS_Terra_Snow_Cover_Daily_Tile', // daily, most common one

  fire_modis: 'VIIRS_SNPP_Thermal_Anomalies_375m_All',
  fire_viirs: 'VIIRS_NOAA20_Thermal_Anomalies_375m_All',

  // 🌫️ Aerosols and Air Quality
  aerosol_modis: 'MODIS_Terra_Aerosol', // Common MODIS AOD layer
  dust_modis: 'MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth' // Most used dust proxy layer
} as const;


export type GibsLayerKey = keyof typeof GIBS_LAYERS;

/**
 * NASA GIBS API Client
 * 
 * Provides access to NASA's Global Imagery Browse Services for environmental
 * monitoring and disaster response applications. All layers are pre-rendered
 * and served as WMTS tiles with no authentication required.
 */
export class NasaGibsClient {
  private baseURL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
  private defaultZoom = 8;
  private maxFallbackDays = 7;

  /**
   * Get tile URL for any GIBS layer (WMTS format)
   * @param layerKey - Short key from GIBS_LAYERS mapping
   * @returns WMTS tile URL template
   */
  getTileURL(layerKey: GibsLayerKey): string {
    const layerId = GIBS_LAYERS[layerKey];

    // Use a recent date (7 days ago to account for processing delays and composite layers)
    // Composite layers like 8-day NDVI need a date that falls within a composite period
    const date = this.getDateDaysAgo(7);

    // Use Web Mercator (EPSG:3857) with GoogleMapsCompatible_Level9
    const tileMatrixSet = 'GoogleMapsCompatible_Level9';

    // WMTS RESTful format
    return `${this.baseURL}/${layerId}/default/${date}/${tileMatrixSet}/{z}/{y}/{x}.png`;
  }

  /**
   * Get flood detection tile URL (WMTS format)
   * @param type - 'viirs_1day', 'viirs_2day', 'viirs_3day', 'modis_1day', 'modis_2day', 'modis_3day'
   * @returns WMTS tile URL template
   */
  getFloodTileURL(type: 'viirs_1day' | 'viirs_2day' | 'viirs_3day' | 'modis_1day' | 'modis_2day' | 'modis_3day'): string {
    const layerKeyMap: Record<typeof type, GibsLayerKey> = {
      viirs_1day: 'flood_viirs_1day',
      viirs_2day: 'flood_viirs_2day',
      viirs_3day: 'flood_viirs_3day',
      modis_1day: 'flood_modis_1day',
      modis_2day: 'flood_modis_2day',
      modis_3day: 'flood_modis_3day'
    };

    return this.getTileURL(layerKeyMap[type]);
  }

  /**
   * Get soil moisture tile URL
   * Uses SMAP (Soil Moisture Active Passive) data for agricultural monitoring
   * @returns WMTS tile URL template
   */
  getSoilMoistureTileURL(): string {
    return this.getTileURL('soil_moisture');
  }

  /**
   * Get land surface temperature tile URL
   * Uses MODIS Terra data - useful for drought monitoring and heat stress analysis
   * @returns WMTS tile URL template
   */
  getLandTempTileURL(): string {
    return this.getTileURL('land_temp_modis');
  }

  /**
   * Get rainfall anomaly tile URL
   * Uses MERRA-2 reanalysis data for precipitation monitoring
   * @returns WMTS tile URL template
   */
  getRainfallAnomalyTileURL(): string {
    return this.getTileURL('rainfall_anomaly');
  }

  /**
   * Get NDVI (vegetation health) tile URL
   * Uses MODIS Terra data for drought and vegetation monitoring
   * @returns WMTS tile URL template
   */
  getNDVITileURL(): string {
    return this.getTileURL('ndvi_modis');
  }

  /**
   * Get fire detection tile URL
   * Uses MODIS Terra thermal anomalies for fire monitoring
   * @returns WMTS tile URL template
   */
  getFireDetectionTileURL(): string {
    return this.getTileURL('fire_modis');
  }

  /**
   * Get aerosol optical depth tile URL
   * Uses MODIS Terra data for air quality and dust monitoring
   * @returns WMTS tile URL template
   */
  getAerosolTileURL(): string {
    return this.getTileURL('aerosol_modis');
  }

  /**
   * Get comprehensive layer information
   * @param layerKey - Short key from GIBS_LAYERS mapping
   * @returns Detailed layer metadata
   */
  getLayerInfo(layerKey: GibsLayerKey): LayerInfo {
    const layerId = GIBS_LAYERS[layerKey];
    
    const layerInfoMap: Record<GibsLayerKey, LayerInfo> = {
      // Flood Detection
      flood_viirs_1day: {
        name: 'VIIRS Flood Detection (1-Day)',
        description: 'Combined VIIRS flood detection from multiple satellites (1-day composite)',
        source: 'NASA GIBS / VIIRS Combined',
        updateFrequency: 'Daily',
        idealZoomLevels: '5-10',
        resolution: '375m',
        dataType: 'Flood Detection',
        useCase: 'Real-time flood monitoring, disaster response',
        layerId
      },
      flood_viirs_2day: {
        name: 'VIIRS Flood Detection (2-Day)',
        description: 'Combined VIIRS flood detection from multiple satellites (2-day composite)',
        source: 'NASA GIBS / VIIRS Combined',
        updateFrequency: 'Daily',
        idealZoomLevels: '5-10',
        resolution: '375m',
        dataType: 'Flood Detection',
        useCase: 'Real-time flood monitoring, disaster response',
        layerId
      },
      flood_viirs_3day: {
        name: 'VIIRS Flood Detection (3-Day)',
        description: 'Combined VIIRS flood detection from multiple satellites (3-day composite)',
        source: 'NASA GIBS / VIIRS Combined',
        updateFrequency: 'Daily',
        idealZoomLevels: '5-10',
        resolution: '375m',
        dataType: 'Flood Detection',
        useCase: 'Real-time flood monitoring, disaster response',
        layerId
      },
      flood_modis_1day: {
        name: 'MODIS Flood Detection (1-Day)',
        description: 'Combined MODIS flood detection from Terra and Aqua (1-day composite)',
        source: 'NASA GIBS / MODIS Combined',
        updateFrequency: 'Daily',
        idealZoomLevels: '4-8',
        resolution: '250m',
        dataType: 'Flood Detection',
        useCase: 'Water body mapping, flood extent analysis',
        layerId
      },
      flood_modis_2day: {
        name: 'MODIS Flood Detection (2-Day)',
        description: 'Combined MODIS flood detection from Terra and Aqua (2-day composite)',
        source: 'NASA GIBS / MODIS Combined',
        updateFrequency: 'Daily',
        idealZoomLevels: '4-8',
        resolution: '250m',
        dataType: 'Flood Detection',
        useCase: 'Water body mapping, flood extent analysis',
        layerId
      },
      flood_modis_3day: {
        name: 'MODIS Flood Detection (3-Day)',
        description: 'Combined MODIS flood detection from Terra and Aqua (3-day composite)',
        source: 'NASA GIBS / MODIS Combined',
        updateFrequency: 'Daily',
        idealZoomLevels: '4-8',
        resolution: '250m',
        dataType: 'Flood Detection',
        useCase: 'Water body mapping, flood extent analysis',
        layerId
      },
      
      // Soil Moisture
      soil_moisture: {
        name: 'SMAP Soil Moisture',
        description: 'Soil moisture content from SMAP (Soil Moisture Active Passive) satellite',
        source: 'NASA GIBS / SMAP',
        updateFrequency: 'Daily',
        idealZoomLevels: '6-10',
        resolution: '9km',
        dataType: 'Soil Moisture',
        useCase: 'Agricultural monitoring, drought assessment',
        layerId
      },
      soil_moisture_anomaly: {
        name: 'SMAP Soil Moisture Anomaly',
        description: 'Soil moisture anomaly compared to long-term average',
        source: 'NASA GIBS / SMAP',
        updateFrequency: 'Daily',
        idealZoomLevels: '6-10',
        resolution: '9km',
        dataType: 'Anomaly',
        useCase: 'Drought monitoring, agricultural planning',
        layerId
      },
      
      // Rainfall
      rainfall_anomaly: {
        name: 'MERRA-2 Rainfall Anomaly',
        description: 'Precipitation anomaly from MERRA-2 reanalysis data',
        source: 'NASA GIBS / MERRA-2',
        updateFrequency: 'Daily',
        idealZoomLevels: '4-8',
        resolution: '50km',
        dataType: 'Precipitation Anomaly',
        useCase: 'Drought monitoring, rainfall pattern analysis',
        layerId
      },
      precipitation: {
        name: 'GPM Precipitation',
        description: 'Global precipitation measurement from GPM mission',
        source: 'NASA GIBS / GPM',
        updateFrequency: 'Daily',
        idealZoomLevels: '4-8',
        resolution: '10km',
        dataType: 'Precipitation',
        useCase: 'Rainfall monitoring, flood prediction',
        layerId
      },
      
      // Land Surface Temperature
      land_temp_modis: {
        name: 'MODIS Land Surface Temperature',
        description: 'Land surface temperature from MODIS Terra - proxy for drought conditions',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: 'Daily',
        idealZoomLevels: '6-10',
        resolution: '1km',
        dataType: 'Land Surface Temperature',
        useCase: 'Drought monitoring, heat stress analysis',
        layerId
      },
      land_temp_viirs: {
        name: 'VIIRS Land Surface Temperature',
        description: 'Land surface temperature from VIIRS - higher resolution thermal data',
        source: 'NASA GIBS / VIIRS',
        updateFrequency: 'Daily',
        idealZoomLevels: '6-12',
        resolution: '375m',
        dataType: 'Land Surface Temperature',
        useCase: 'Drought monitoring, urban heat island analysis',
        layerId
      },
      
      // Vegetation
      ndvi_modis: {
        name: 'MODIS NDVI',
        description: 'Normalized Difference Vegetation Index from MODIS Terra',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: '16-day composite',
        idealZoomLevels: '6-10',
        resolution: '250m',
        dataType: 'Vegetation Index',
        useCase: 'Vegetation health monitoring, drought assessment',
        layerId
      },
      evi_modis: {
        name: 'MODIS EVI',
        description: 'Enhanced Vegetation Index from MODIS Terra',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: '16-day composite',
        idealZoomLevels: '6-10',
        resolution: '250m',
        dataType: 'Vegetation Index',
        useCase: 'Vegetation health monitoring, agricultural assessment',
        layerId
      },
      
      // Water and Hydrology
      water_mask_modis: {
        name: 'MODIS Water Mask',
        description: 'Permanent water body mask from MODIS Terra',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: 'Static',
        idealZoomLevels: '4-8',
        resolution: '250m',
        dataType: 'Water Mask',
        useCase: 'Water body mapping, baseline water extent',
        layerId
      },
      snow_cover: {
        name: 'MODIS Snow Cover',
        description: 'Daily snow cover extent from MODIS Terra',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: 'Daily',
        idealZoomLevels: '6-10',
        resolution: '500m',
        dataType: 'Snow Cover',
        useCase: 'Snow monitoring, water resource management',
        layerId
      },
      
      // Fire Detection
      fire_modis: {
        name: 'MODIS Fire Detection',
        description: 'Thermal anomalies and fire detection from MODIS Terra',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: 'Daily',
        idealZoomLevels: '6-10',
        resolution: '1km',
        dataType: 'Fire Detection',
        useCase: 'Fire monitoring, wildfire tracking',
        layerId
      },
      fire_viirs: {
        name: 'VIIRS Fire Detection',
        description: 'Thermal anomalies and fire detection from VIIRS',
        source: 'NASA GIBS / VIIRS',
        updateFrequency: 'Daily',
        idealZoomLevels: '6-12',
        resolution: '375m',
        dataType: 'Fire Detection',
        useCase: 'Fire monitoring, wildfire tracking',
        layerId
      },
      
      // Aerosols
      aerosol_modis: {
        name: 'MODIS Aerosol Optical Depth',
        description: 'Aerosol optical depth from MODIS Terra for air quality monitoring',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: 'Daily',
        idealZoomLevels: '4-8',
        resolution: '10km',
        dataType: 'Aerosol',
        useCase: 'Air quality monitoring, dust tracking',
        layerId
      },
      dust_modis: {
        name: 'MODIS Dust Score',
        description: 'Dust detection and tracking from MODIS Terra',
        source: 'NASA GIBS / MODIS Terra',
        updateFrequency: 'Daily',
        idealZoomLevels: '4-8',
        resolution: '10km',
        dataType: 'Dust Detection',
        useCase: 'Dust storm monitoring, air quality assessment',
        layerId
      }
    };

    return layerInfoMap[layerKey];
  }

  /**
   * Check if a layer is available for a specific date
   * Sends a HEAD request to validate tile existence
   * @param layerId - Full layer ID from GIBS_LAYERS
   * @param date - Date in YYYY-MM-DD format
   * @param zoom - Zoom level (defaults to 8)
   * @returns Promise<boolean> - true if layer is available
   */
  async checkLayerAvailability(layerId: string, date: string, zoom: number = 8): Promise<boolean> {
    try {
      // Test with a specific tile coordinate (center of Africa)
      const testTileURL = `${this.baseURL}/${layerId}/default/${date}/GoogleMapsCompatible_Level${zoom}/8/128/128.png`;
      
      const response = await axios.head(testTileURL, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 404s but not server errors
      });
      
      return response.status === 200;
    } catch (error) {
      console.warn(`Layer availability check failed for ${layerId} on ${date}:`, error);
      return false;
    }
  }

  /**
   * Get fallback dates for when imagery is unavailable
   * @param days - Number of days to look back (defaults to 7)
   * @returns Array of date strings in YYYY-MM-DD format
   */
  getFallbackDates(days: number = this.maxFallbackDays): string[] {
    const dates: string[] = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      dates.push(`${year}-${month}-${day}`);
    }
    
    return dates;
  }

  /**
   * Get the best available date for a layer
   * Checks availability starting from the target date and falls back to previous days
   * @param layerKey - Short key from GIBS_LAYERS mapping
   * @param targetDate - Preferred date in YYYY-MM-DD format (defaults to today)
   * @returns Promise<string> - Best available date
   */
  async getBestAvailableDate(layerKey: GibsLayerKey, targetDate?: string): Promise<string> {
    const layerId = GIBS_LAYERS[layerKey];
    const preferredDate = targetDate || this.getCurrentDate();
    const fallbackDates = this.getFallbackDates();
    
    // Check preferred date first
    if (await this.checkLayerAvailability(layerId, preferredDate)) {
      return preferredDate;
    }
    
    // Check fallback dates
    for (const date of fallbackDates) {
      if (await this.checkLayerAvailability(layerId, date)) {
        return date;
      }
    }
    
    // Return preferred date even if not available (let the map handle the 404)
    return preferredDate;
  }

  /**
   * Get current date in YYYY-MM-DD format
   * @returns Current date string
   */
  private getCurrentDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get date N days ago in YYYY-MM-DD format
   * @param days - Number of days to subtract from current date
   * @returns Date string
   */
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get all available layer keys
   * @returns Array of all available layer keys
   */
  getAllLayerKeys(): GibsLayerKey[] {
    return Object.keys(GIBS_LAYERS) as GibsLayerKey[];
  }

  /**
   * Get layers suitable for specific use cases
   * @param useCase - Use case to filter by
   * @returns Array of layer keys matching the use case
   */
  getLayersByUseCase(useCase: string): GibsLayerKey[] {
    return this.getAllLayerKeys().filter(key => 
      this.getLayerInfo(key).useCase.toLowerCase().includes(useCase.toLowerCase())
    );
  }
}

// Export singleton instance
export const nasaGibsClient = new NasaGibsClient();

/**
 * =============================================================================
 * EXAMPLE USAGE
 * =============================================================================
 * 
 * // Basic usage with Mapbox
 * import { NasaGibsClient } from '@/lib/api/nasa-gibs';
 * 
 * const gibs = new NasaGibsClient();
 * 
 * // Add flood detection layer
 * map.addSource('nasa-flood', {
 *   type: 'raster',
 *   tiles: [gibs.getFloodTileURL('viirs')],
 *   tileSize: 256
 * });
 * 
 * map.addLayer({
 *   id: 'nasa-flood-layer',
 *   type: 'raster',
 *   source: 'nasa-flood',
 *   paint: { 'raster-opacity': 0.7 }
 * });
 * 
 * // Add soil moisture layer
 * map.addSource('nasa-soil', {
 *   type: 'raster',
 *   tiles: [gibs.getSoilMoistureTileURL()],
 *   tileSize: 256
 * });
 * 
 * map.addLayer({
 *   id: 'nasa-soil-layer',
 *   type: 'raster',
 *   source: 'nasa-soil',
 *   paint: { 'raster-opacity': 0.6 }
 * });
 * 
 * // Dynamic layer loading
 * const layerKey = 'flood_viirs';
 * const tileURL = gibs.getTileURL(layerKey, '2024-01-15', 8);
 * 
 * // Check layer availability
 * const isAvailable = await gibs.checkLayerAvailability(
 *   gibs.getLayerInfo(layerKey).layerId, 
 *   '2024-01-15'
 * );
 * 
 * // Get best available date
 * const bestDate = await gibs.getBestAvailableDate(layerKey);
 * 
 * =============================================================================
 * LAYERS SUITABLE FOR RWANDA
 * =============================================================================
 * 
 * For Rwanda's climate and geography, these layers are most suitable:
 * 
 * FLOOD MONITORING:
 * - flood_viirs: Best for real-time flood detection
 * - flood_modis_terra: Good for water body mapping
 * - precipitation: For rainfall monitoring and flood prediction
 * 
 * DROUGHT MONITORING:
 * - soil_moisture: Essential for agricultural drought assessment
 * - land_temp_modis: Land surface temperature as drought proxy
 * - ndvi_modis: Vegetation health monitoring
 * - rainfall_anomaly: Precipitation deficit analysis
 * 
 * TEMPERATURE MONITORING:
 * - land_temp_modis: Daily land surface temperature
 * - land_temp_viirs: Higher resolution thermal data
 * 
 * AGRICULTURAL MONITORING:
 * - soil_moisture: Soil water content for crop health
 * - ndvi_modis: Vegetation vigor assessment
 * - evi_modis: Enhanced vegetation index
 * 
 * =============================================================================
 * EXTENDING FOR FUTURE LAYERS
 * =============================================================================
 * 
 * To add new layers:
 * 
 * 1. Add layer ID to GIBS_LAYERS constant:
 *    new_layer: 'NEW_LAYER_ID'
 * 
 * 2. Add layer info to getLayerInfo() method:
 *    new_layer: {
 *      name: 'New Layer Name',
 *      description: 'Layer description',
 *      source: 'Data source',
 *      updateFrequency: 'Update frequency',
 *      idealZoomLevels: 'Recommended zoom range',
 *      resolution: 'Spatial resolution',
 *      dataType: 'Data type',
 *      useCase: 'Primary use case',
 *      layerId
 *    }
 * 
 * 3. Add convenience method if needed:
 *    getNewLayerTileURL(date?: string, zoom?: number): string {
 *      return this.getTileURL('new_layer', date, zoom);
 *    }
 * 
 * =============================================================================
 */
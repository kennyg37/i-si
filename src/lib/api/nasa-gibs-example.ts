/**
 * NASA GIBS Integration Example for Mapbox
 * 
 * This file demonstrates how to integrate the NASA GIBS client
 * with your existing Mapbox map implementation.
 */

import { NasaGibsClient } from './nasa-gibs';
import type { Map } from 'mapbox-gl';

export class NasaGibsMapIntegration {
  private gibs: NasaGibsClient;
  private map: Map;

  constructor(map: Map) {
    this.gibs = new NasaGibsClient();
    this.map = map;
  }

  /**
   * Add flood detection layer to the map
   */
  async addFloodDetectionLayer(type: 'viirs' | 'modis' = 'viirs') {
    const sourceId = 'nasa-flood';
    const layerId = 'nasa-flood-layer';

    // Remove existing layer if present
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    // Get best available date
    let layerKey: 'flood_viirs_1day' | 'flood_modis_1day';
    if (type === 'viirs') {
      layerKey = 'flood_viirs_1day';
    } else {
      layerKey = 'flood_modis_1day';
    }
    const bestDate = await this.gibs.getBestAvailableDate(layerKey);
    const tileURL = this.gibs.getFloodTileURL(layerKey, bestDate);

    // Add source
    this.map.addSource(sourceId, {
      type: 'raster',
      tiles: [tileURL],
      tileSize: 256
    });

    // Add layer
    this.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.7
      }
    });

    console.log(`Added ${type.toUpperCase()} flood detection layer for date: ${bestDate}`);
  }

  /**
   * Add soil moisture layer to the map
   */
  async addSoilMoistureLayer() {
    const sourceId = 'nasa-soil-moisture';
    const layerId = 'nasa-soil-moisture-layer';

    // Remove existing layer if present
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    // Get best available date
    const bestDate = await this.gibs.getBestAvailableDate('soil_moisture');
    const tileURL = this.gibs.getSoilMoistureTileURL(bestDate);

    // Add source
    this.map.addSource(sourceId, {
      type: 'raster',
      tiles: [tileURL],
      tileSize: 256
    });

    // Add layer
    this.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.6
      }
    });

    console.log(`Added soil moisture layer for date: ${bestDate}`);
  }

  /**
   * Add land surface temperature layer to the map
   */
  async addLandTemperatureLayer() {
    const sourceId = 'nasa-land-temp';
    const layerId = 'nasa-land-temp-layer';

    // Remove existing layer if present
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    // Get best available date
    const bestDate = await this.gibs.getBestAvailableDate('land_temp_modis');
    const tileURL = this.gibs.getLandTempTileURL(bestDate);

    // Add source
    this.map.addSource(sourceId, {
      type: 'raster',
      tiles: [tileURL],
      tileSize: 256
    });

    // Add layer
    this.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.6
      }
    });

    console.log(`Added land surface temperature layer for date: ${bestDate}`);
  }

  /**
   * Add NDVI vegetation layer to the map
   */
  async addNDVILayer() {
    const sourceId = 'nasa-ndvi';
    const layerId = 'nasa-ndvi-layer';

    // Remove existing layer if present
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }

    // Get best available date
    const bestDate = await this.gibs.getBestAvailableDate('ndvi_modis');
    const tileURL = this.gibs.getNDVITileURL(bestDate);

    // Add source
    this.map.addSource(sourceId, {
      type: 'raster',
      tiles: [tileURL],
      tileSize: 256
    });

    // Add layer
    this.map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.6
      }
    });

    console.log(`Added NDVI vegetation layer for date: ${bestDate}`);
  }

  /**
   * Remove a specific layer
   */
  removeLayer(layerId: string) {
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(layerId.replace('-layer', ''))) {
      this.map.removeSource(layerId.replace('-layer', ''));
    }
  }

  /**
   * Remove all NASA GIBS layers
   */
  removeAllLayers() {
    const layerIds = [
      'nasa-flood-layer',
      'nasa-soil-moisture-layer',
      'nasa-land-temp-layer',
      'nasa-ndvi-layer'
    ];

    layerIds.forEach(layerId => this.removeLayer(layerId));
  }

  /**
   * Get layer information for display in UI
   */
  getLayerInfo(layerKey: string) {
    return this.gibs.getLayerInfo(layerKey as keyof typeof import('./nasa-gibs').GIBS_LAYERS);
  }

  /**
   * Check if a layer is available for a specific date
   */
  async checkLayerAvailability(layerKey: string, date: string) {
    const layerInfo = this.gibs.getLayerInfo(layerKey as keyof typeof import('./nasa-gibs').GIBS_LAYERS);
    return this.gibs.checkLayerAvailability(layerInfo.layerId, date);
  }
}

/**
 * Usage example in your map component:
 * 
 * ```typescript
 * import { NasaGibsMapIntegration } from '@/lib/api/nasa-gibs-example';
 * 
 * // In your map component
 * const [gibsIntegration, setGibsIntegration] = useState<NasaGibsMapIntegration | null>(null);
 * 
 * useEffect(() => {
 *   if (mapRef.current) {
 *     const integration = new NasaGibsMapIntegration(mapRef.current.getMap());
 *     setGibsIntegration(integration);
 *   }
 * }, [mapRef.current]);
 * 
 * // Add layers
 * const handleAddFloodLayer = async () => {
 *   if (gibsIntegration) {
 *     await gibsIntegration.addFloodDetectionLayer('viirs');
 *   }
 * };
 * 
 * const handleAddSoilMoistureLayer = async () => {
 *   if (gibsIntegration) {
 *     await gibsIntegration.addSoilMoistureLayer();
 *   }
 * };
 * ```
 */

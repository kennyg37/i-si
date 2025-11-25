/**
 * NASA GIBS Legend/Colorbar Configuration
 * Based on: https://nasa-gibs.github.io/gibs-api-docs/access-advanced-topics/
 */

import type { GibsLayerKey } from './nasa-gibs';

export type LegendOrientation = 'horizontal' | 'vertical';
export type LegendFormat = 'png' | 'svg';

/**
 * Legend metadata for each GIBS layer
 */
export const GIBS_LEGENDS = {
  'nasa-viirs-flood': {
    hasLegend: true,
    layerName: 'MODIS_Water_Mask',
    type: 'classification' as const,
    description: 'Water body classification (land vs water)'
  },
  'nasa-flood-risk': {
    hasLegend: true,
    layerName: 'LECZ_Urban_Rural_Extents_Below_10m',
    type: 'classification' as const,
    description: 'Urban/rural areas below 10m elevation'
  },
  'nasa-land-temp': {
    hasLegend: true,
    layerName: 'MODIS_Terra_Land_Surface_Temp_Day',
    type: 'continuous' as const,
    description: 'Temperature scale in Kelvin',
    unit: 'K'
  },
  'nasa-soil-moisture': {
    hasLegend: true,
    layerName: 'SMAP_L3_Passive_Night_Soil_Moisture',
    type: 'continuous' as const,
    description: 'Soil moisture (cm³/cm³)',
    unit: 'cm³/cm³'
  },
  'nasa-rainfall-anomaly': {
    hasLegend: true,
    layerName: 'AIRS_Precipitation_Day',
    type: 'continuous' as const,
    description: 'Precipitation rate (mm/day)',
    unit: 'mm/day'
  },
  'nasa-ndvi': {
    hasLegend: true,
    layerName: 'MODIS_Terra_NDVI_8Day',
    type: 'continuous' as const,
    description: 'NDVI vegetation index (-1 to 1)',
    unit: 'NDVI'
  },
  'nasa-lai': {
    hasLegend: true,
    layerName: '',
    type: 'continuous' as const,
    description: '',
    unit: 'unknown'
  },
  'nasa-fire': {
    hasLegend: true,
    layerName: 'VIIRS_SNPP_Thermal_Anomalies_375m_All',
    type: 'discrete' as const,
    description: 'Fire confidence levels',
    isVector: true
  }
} as const;

export const gibsLegends = {
  /**
   * Get pre-generated legend image URL
   * Format: PNG or SVG, Horizontal or Vertical
   */
  getLegendUrl(
    layerKey: GibsLayerKey,
    options: {
      format?: LegendFormat;
      orientation?: LegendOrientation;
    } = {}
  ): string {
    const { format = 'png', orientation = 'horizontal' } = options;
    const legend = GIBS_LEGENDS[layerKey];

    if (!legend?.hasLegend) return '';

    const baseUrl = 'https://gibs.earthdata.nasa.gov/legends';
    const suffix = orientation === 'horizontal' ? 'H' : 'V';

    return `${baseUrl}/${legend.layerName}_${suffix}.${format}`;
  },

  /**
   * Get colormap XML URL for detailed color mapping
   */
  getColormapUrl(layerKey: GibsLayerKey): string {
    const legend = GIBS_LEGENDS[layerKey];
    if (!legend?.hasLegend) return '';

    return `https://gibs.earthdata.nasa.gov/colormaps/v1.3/${legend.layerName}.xml`;
  },

  /**
   * Get dynamic legend via WMS GetLegendGraphic (useful for vector layers)
   */
  getDynamicLegendUrl(layerKey: GibsLayerKey): string {
    const legend = GIBS_LEGENDS[layerKey];
    if (!legend?.hasLegend) return '';

    const baseUrl = 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi';
    const params = new URLSearchParams({
      version: '1.1.1',
      service: 'WMS',
      request: 'GetLegendGraphic',
      layer: legend.layerName,
      format: 'image/png',
      STYLE: 'default'
    });

    return `${baseUrl}?${params.toString()}`;
  },

  /**
   * Check if layer has legend available
   */
  hasLegend(layerKey: GibsLayerKey): boolean {
    return GIBS_LEGENDS[layerKey]?.hasLegend ?? false;
  },

  /**
   * Get legend metadata
   */
  getLegendMetadata(layerKey: GibsLayerKey) {
    return GIBS_LEGENDS[layerKey];
  }
};

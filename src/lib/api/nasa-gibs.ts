/**
 * NASA GIBS API Configuration
 * Extracted from wmts.cgi.xml (EPSG:3857)
 */

export const GIBS_DATASETS = {
  // --- FLOOD (Static Water Reference) ---
  // XML: <Identifier>MODIS_Water_Mask</Identifier>
  // Set: GoogleMapsCompatible_Level9
  'nasa-viirs-flood': {
    id: 'MODIS_Water_Mask',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    type: 'static',
    title: 'Flood / Water Mask',
    maxZoom: 9
  },

  // --- FLOOD RISK (Coastal Low Elevation) ---
  // XML: <Identifier>LECZ_Urban_Rural_Extents_Below_10m</Identifier>
  // Set: GoogleMapsCompatible_Level7
  // FACT: New layer found in your XML. Shows areas <10m elevation (High Flood Risk)
  'nasa-flood-risk': {
    id: 'LECZ_Urban_Rural_Extents_Below_10m',
    matrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    type: 'static',
    title: 'Coastal Flood Risk (<10m)',
    maxZoom: 7
  },

  // --- PRECIPITATION (Daily - Replaces GLDAS) ---
  // XML: <Identifier>AIRS_Precipitation_Day</Identifier>
  // Set: GoogleMapsCompatible_Level6
  // FACT: Switched to AIRS because GLDAS in your XML is Monthly (not useful for real-time)
  'nasa-rainfall-anomaly': {
    id: 'AIRS_Precipitation_Day',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    type: 'temporal',
    latency: 3, // Conservative 3-day latency for reliability
    maxZoom: 6
  },

  // --- TEMPERATURE ---
  // XML: <Identifier>MODIS_Terra_Land_Surface_Temp_Day</Identifier>
  'nasa-land-temp': {
    id: 'MODIS_Terra_Land_Surface_Temp_Day',
    matrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    type: 'temporal',
    latency: 3, // Conservative 3-day latency for reliability
    maxZoom: 7
  },

  // --- SOIL MOISTURE ---
  // XML: <Identifier>SMAP_L3_Passive_Night_Soil_Moisture</Identifier>
  'nasa-soil-moisture': {
    id: 'SMAP_L3_Passive_Night_Soil_Moisture',
    matrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    type: 'temporal',
    latency: 5, // Conservative 5-day latency for reliability
    maxZoom: 6
  },

  // --- NDVI ---
  // XML: <Identifier>MODIS_Terra_NDVI_8Day</Identifier>
  'nasa-ndvi': {
    id: 'MODIS_Terra_NDVI_8Day',
    matrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    type: 'temporal',
    latency: 10, // Conservative 10-day latency (8-day product + 2-day buffer)
    maxZoom: 9
  },

  // --- LEAF AREA INDEX ---
  // XML: <Identifier>MODIS_Combined_L4_LAI_8Day</Identifier>
  // Leaf Area Index (LAI) measures vegetation canopy density
  'nasa-lai': {
    id: 'MODIS_Combined_L4_LAI_8Day',
    matrixSet: 'GoogleMapsCompatible_Level8',
    format: 'png',
    type: 'temporal',
    latency: 10, // Conservative 10-day latency (8-day product + 2-day buffer)
    maxZoom: 8
  },

   // --- FIRE ---
   // XML: <Identifier>VIIRS_SNPP_Thermal_Anomalies_375m_All</Identifier>
   // FACT: XML defines this as "application/vnd.mapbox-vector-tie" (MVT)
  'nasa-fire': {
    id: 'VIIRS_SNPP_Thermal_Anomalies_375m_All',
    matrixSet: 'GoogleMapsCompatible_Level8',
    format: 'mvt',
    type: 'temporal',
    latency: 2, // Conservative 2-day latency for reliability
    maxZoom: 8
  }
} as const;

export type GibsLayerKey = keyof typeof GIBS_DATASETS;

export const gibsClient = {
  getTileUrl(layerKey: GibsLayerKey, date?: string): string {
    const baseUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

    // --- HARDCODED URLS (Extracted from XML) ---

    if (layerKey === 'nasa-viirs-flood') {
      // Template: .../MODIS_Water_Mask/default/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png
      // Note: No Time parameter allowed
      return `${baseUrl}/MODIS_Water_Mask/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
    }

    if (layerKey === 'nasa-flood-risk') {
      // Template: .../LECZ_Urban_Rural_Extents_Below_10m/default/{TileMatrixSet}/...
      return `${baseUrl}/LECZ_Urban_Rural_Extents_Below_10m/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
    }

    // --- TEMPORAL LAYERS ---

    // Calculate Date
    const layer = GIBS_DATASETS[layerKey];
    let dateStr = date;
    if (!dateStr) {
      const d = new Date();
      d.setDate(d.getDate() - (layer as any).latency);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dateStr = `${yyyy}-${mm}-${dd}`;
    }

    if (layerKey === 'nasa-land-temp') {
       return `${baseUrl}/MODIS_Terra_Land_Surface_Temp_Day/default/${dateStr}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
    }

    if (layerKey === 'nasa-soil-moisture') {
       return `${baseUrl}/SMAP_L3_Passive_Night_Soil_Moisture/default/${dateStr}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;
    }

    if (layerKey === 'nasa-rainfall-anomaly') {
       // Switched to AIRS Daily Precipitation (Level 6)
       return `${baseUrl}/AIRS_Precipitation_Day/default/${dateStr}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;
    }

    if (layerKey === 'nasa-ndvi') {
       return `${baseUrl}/MODIS_Terra_NDVI_8Day/default/${dateStr}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
    }

    if (layerKey === 'nasa-fire') {
       // Vector Tile (MVT)
       return `${baseUrl}/VIIRS_SNPP_Thermal_Anomalies_375m_All/default/${dateStr}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.mvt`;
    }

    return '';
  },

  getMaxZoom(layerKey: GibsLayerKey): number {
    return GIBS_DATASETS[layerKey]?.maxZoom || 6;
  },

  isVector(layerKey: GibsLayerKey): boolean {
    return GIBS_DATASETS[layerKey]?.format === 'mvt';
  }
};

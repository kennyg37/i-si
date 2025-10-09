/**
 * Satellite Data API Integration
 * Provides access to various satellite-derived climate and environmental data
 */

export interface NDVIData {
  date: string;
  value: number;
  quality: 'high' | 'medium' | 'low';
  source: 'MODIS' | 'Landsat' | 'Sentinel-2';
}

export interface LandSurfaceTemperature {
  date: string;
  dayTemp: number;
  nightTemp: number;
  average: number;
  source: 'MODIS' | 'Landsat';
}

export interface SoilMoisture {
  date: string;
  surface: number; // 0-1 scale
  rootZone: number; // 0-1 scale
  source: 'SMAP' | 'SMOS' | 'Sentinel-1';
}

export interface Evapotranspiration {
  date: string;
  actual: number; // mm/day
  potential: number; // mm/day
  ratio: number; // actual/potential
  source: 'MODIS' | 'Landsat';
}

export interface LandUseData {
  type: 'agricultural' | 'forest' | 'urban' | 'water' | 'barren';
  percentage: number;
  area: number; // km²
  change: number; // % change from previous year
}

export interface SatelliteDataResponse {
  coordinates: {
    lat: number;
    lon: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
  ndvi: NDVIData[];
  landSurfaceTemp: LandSurfaceTemperature[];
  soilMoisture: SoilMoisture[];
  evapotranspiration: Evapotranspiration[];
  landUse: LandUseData[];
  metadata: {
    resolution: string;
    cloudCover: number;
    processingDate: string;
  };
}

/**
 * Calculate NDVI from satellite imagery
 * NDVI = (NIR - Red) / (NIR + Red)
 */
export function calculateNDVI(nir: number, red: number): number {
  if (nir + red === 0) return 0;
  return (nir - red) / (nir + red);
}

/**
 * Calculate vegetation health index from NDVI
 */
export function calculateVegetationHealth(ndvi: number): {
  health: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  score: number;
} {
  if (ndvi >= 0.7) return { health: 'excellent', score: 1.0 };
  if (ndvi >= 0.5) return { health: 'good', score: 0.8 };
  if (ndvi >= 0.3) return { health: 'moderate', score: 0.6 };
  if (ndvi >= 0.1) return { health: 'poor', score: 0.4 };
  return { health: 'critical', score: 0.2 };
}

/**
 * Calculate drought stress from soil moisture and evapotranspiration
 */
export function calculateDroughtStress(
  soilMoisture: number,
  evapotranspiration: number,
  potentialET: number
): {
  stress: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme';
  score: number;
} {
  const etRatio = evapotranspiration / potentialET;
  const combinedScore = (1 - soilMoisture) * 0.6 + (1 - etRatio) * 0.4;
  
  if (combinedScore >= 0.8) return { stress: 'extreme', score: combinedScore };
  if (combinedScore >= 0.6) return { stress: 'severe', score: combinedScore };
  if (combinedScore >= 0.4) return { stress: 'moderate', score: combinedScore };
  if (combinedScore >= 0.2) return { stress: 'mild', score: combinedScore };
  return { stress: 'none', score: combinedScore };
}

/**
 * Fetch satellite data from Sentinel Hub API
 */
export async function fetchSatelliteData(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  dataTypes: ('ndvi' | 'lst' | 'soil' | 'et' | 'landuse')[] = ['ndvi', 'lst']
): Promise<SatelliteDataResponse> {
  try {
    // This would integrate with Sentinel Hub API
    // For now, returning mock data structure
    const mockData: SatelliteDataResponse = {
      coordinates: { lat, lon },
      timeRange: { start: startDate, end: endDate },
      ndvi: generateMockNDVIData(startDate, endDate),
      landSurfaceTemp: generateMockLSTData(startDate, endDate),
      soilMoisture: generateMockSoilMoistureData(startDate, endDate),
      evapotranspiration: generateMockETData(startDate, endDate),
      landUse: generateMockLandUseData(),
      metadata: {
        resolution: '250m',
        cloudCover: 15,
        processingDate: new Date().toISOString()
      }
    };

    return mockData;
  } catch (error) {
    console.error('Error fetching satellite data:', error);
    throw new Error('Failed to fetch satellite data');
  }
}

// Mock data generators for development
function generateMockNDVIData(startDate: string, endDate: string): NDVIData[] {
  const data: NDVIData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 8)) {
    data.push({
      date: d.toISOString().split('T')[0],
      value: 0.3 + Math.random() * 0.5, // 0.3 to 0.8
      quality: Math.random() > 0.2 ? 'high' : 'medium',
      source: 'MODIS'
    });
  }
  
  return data;
}

function generateMockLSTData(startDate: string, endDate: string): LandSurfaceTemperature[] {
  const data: LandSurfaceTemperature[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 8)) {
    const baseTemp = 20 + Math.random() * 10;
    data.push({
      date: d.toISOString().split('T')[0],
      dayTemp: baseTemp + 5 + Math.random() * 5,
      nightTemp: baseTemp - 5 - Math.random() * 5,
      average: baseTemp,
      source: 'MODIS'
    });
  }
  
  return data;
}

function generateMockSoilMoistureData(startDate: string, endDate: string): SoilMoisture[] {
  const data: SoilMoisture[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    data.push({
      date: d.toISOString().split('T')[0],
      surface: 0.2 + Math.random() * 0.6,
      rootZone: 0.3 + Math.random() * 0.5,
      source: 'SMAP'
    });
  }
  
  return data;
}

function generateMockETData(startDate: string, endDate: string): Evapotranspiration[] {
  const data: Evapotranspiration[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 8)) {
    const potential = 2 + Math.random() * 4;
    const actual = potential * (0.6 + Math.random() * 0.4);
    data.push({
      date: d.toISOString().split('T')[0],
      actual,
      potential,
      ratio: actual / potential,
      source: 'MODIS'
    });
  }
  
  return data;
}

function generateMockLandUseData(): LandUseData[] {
  return [
    { type: 'agricultural', percentage: 45, area: 1200, change: 2.1 },
    { type: 'forest', percentage: 30, area: 800, change: -1.2 },
    { type: 'urban', percentage: 15, area: 400, change: 5.3 },
    { type: 'water', percentage: 8, area: 200, change: 0.1 },
    { type: 'barren', percentage: 2, area: 50, change: -0.5 }
  ];
}

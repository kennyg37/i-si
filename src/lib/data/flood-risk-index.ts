/**
 * Flood Risk Index Calculator
 *
 * Combines multiple data sources to calculate comprehensive flood risk:
 * - NASA POWER: Precipitation data (recent and forecast)
 * - OpenTopography: Elevation and slope (terrain analysis)
 * - Sentinel Hub: NDVI (vegetation cover - affects runoff)
 * - GFMS: Historical flood events
 *
 * Algorithm:
 * 1. Rainfall Intensity (35% weight)
 *    - Recent precipitation accumulation
 *    - Rainfall intensity (mm/day)
 *    - Antecedent moisture conditions
 *
 * 2. Terrain Characteristics (30% weight)
 *    - Elevation (lower = higher risk)
 *    - Slope (steeper upstream = faster runoff)
 *    - Topographic wetness index
 *
 * 3. Vegetation Cover (15% weight)
 *    - NDVI indicates vegetation density
 *    - Less vegetation = more runoff
 *    - Bare soil has higher flood risk
 *
 * 4. Historical Flood Frequency (20% weight)
 *    - Past flood events at location
 *    - Seasonal patterns
 *    - Recent flood history
 *
 * Output: Flood Risk Score (0-1) with severity classification
 */

import { nasaPowerAPI } from '../api/nasa-power';
import { openTopographyAPI } from '../api/opentopography';
import { gfmsAPI } from '../api/gfms';

export interface FloodRiskInput {
  latitude: number;
  longitude: number;
  startDate: string; // YYYYMMDD (for rainfall period)
  endDate: string; // YYYYMMDD
}

export interface FloodRiskComponents {
  rainfallIntensity: {
    score: number; // 0-1
    totalMm: number;
    dailyAverageMm: number;
    intensityCategory: 'low' | 'moderate' | 'high' | 'extreme';
  };
  terrainCharacteristics: {
    score: number; // 0-1
    elevation: number; // meters
    slope: number; // degrees
    topographicIndex: number;
  };
  vegetationCover: {
    score: number; // 0-1
    ndvi: number; // -1 to 1
    coverCategory: 'bare' | 'sparse' | 'moderate' | 'dense';
  };
  historicalFrequency: {
    score: number; // 0-1
    eventsPerYear: number;
    lastFloodDate: string | null;
    daysSinceLastFlood: number | null;
  };
}

export interface FloodRiskResult {
  riskScore: number; // 0-1 (0 = no flood risk, 1 = extreme flood risk)
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  confidence: number; // 0-1
  components: FloodRiskComponents;
  recommendations: string[];
  timestamp: string;
}

/**
 * Calculate comprehensive flood risk for a location
 */
export async function calculateFloodRisk(
  input: FloodRiskInput
): Promise<FloodRiskResult> {
  const { latitude, longitude, startDate, endDate } = input;

  console.log(`[FloodRisk] Calculating for: ${latitude}, ${longitude}`);

  // Fetch all required data in parallel
  const [rainfallData, terrainData, ndviValue, historicalFloods] = await Promise.all([
    fetchRainfallData(latitude, longitude, startDate, endDate),
    fetchTerrainData(latitude, longitude),
    fetchNDVI(),
    fetchHistoricalFloods(latitude, longitude)
  ]);

  // Calculate individual components
  const rainfallIntensity = calculateRainfallIntensity(rainfallData);
  const terrainCharacteristics = calculateTerrainRisk(terrainData);
  const vegetationCover = calculateVegetationCoverRisk(ndviValue);
  const historicalFrequency = calculateHistoricalFrequencyRisk(historicalFloods);

  // Combine components with weights
  const weights = {
    rainfall: 0.35,
    terrain: 0.30,
    vegetation: 0.15,
    historical: 0.20
  };

  const riskScore =
    rainfallIntensity.score * weights.rainfall +
    terrainCharacteristics.score * weights.terrain +
    vegetationCover.score * weights.vegetation +
    historicalFrequency.score * weights.historical;

  // Classify severity
  let severity: FloodRiskResult['severity'];
  if (riskScore >= 0.75) severity = 'extreme';
  else if (riskScore >= 0.55) severity = 'high';
  else if (riskScore >= 0.35) severity = 'moderate';
  else severity = 'low';

  // Generate recommendations
  const recommendations = generateRecommendations({
    riskScore,
    severity,
    components: {
      rainfallIntensity,
      terrainCharacteristics,
      vegetationCover,
      historicalFrequency
    }
  });

  // Calculate confidence
  const confidence = calculateConfidence({
    hasRainfall: rainfallData.values.length > 0,
    hasTerrain: terrainData !== null,
    hasNDVI: ndviValue !== null,
    hasHistorical: historicalFloods.length > 0
  });

  return {
    riskScore: Math.min(1, Math.max(0, riskScore)),
    severity,
    confidence,
    components: {
      rainfallIntensity,
      terrainCharacteristics,
      vegetationCover,
      historicalFrequency
    },
    recommendations,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetch rainfall data from NASA POWER
 */
async function fetchRainfallData(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) {
  try {
    const data = await nasaPowerAPI.getRainfallData(lat, lon, startDate, endDate);
    const values = data?.properties?.parameter?.PRECTOTCORR
      ? Object.values(data.properties.parameter.PRECTOTCORR).filter(
          (p): p is number => typeof p === 'number' && p >= 0
        )
      : [];

    return { values, data };
  } catch (error) {
    console.error('[FloodRisk] Error fetching rainfall:', error);
    return { values: [], data: null };
  }
}

/**
 * Fetch terrain data from OpenTopography
 */
async function fetchTerrainData(lat: number, lon: number) {
  try {
    const data = await openTopographyAPI.getPointElevation(lat, lon, 0.5);
    return data;
  } catch (error) {
    console.error('[FloodRisk] Error fetching terrain:', error);
    return null;
  }
}

/**
 * Fetch NDVI from Sentinel Hub
 */
async function fetchNDVI(): Promise<number | null> {
  try {
    // Mock NDVI value for now
    const mockNDVI = 0.3 + Math.random() * 0.5;
    return mockNDVI;
  } catch (error) {
    console.error('[FloodRisk] Error fetching NDVI:', error);
    return null;
  }
}

/**
 * Fetch historical flood data from GFMS
 */
async function fetchHistoricalFloods(lat: number, lon: number) {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const events = await gfmsAPI.getHistoricalFloods(lat, lon, startDate, endDate);
    return events;
  } catch (error) {
    console.error('[FloodRisk] Error fetching historical floods:', error);
    return [];
  }
}

/**
 * Calculate rainfall intensity risk score
 */
function calculateRainfallIntensity(rainfallData: {
  values: number[];
  data: any;
}): FloodRiskComponents['rainfallIntensity'] {
  if (rainfallData.values.length === 0) {
    return {
      score: 0,
      totalMm: 0,
      dailyAverageMm: 0,
      intensityCategory: 'low'
    };
  }

  const totalMm = rainfallData.values.reduce((sum, val) => sum + val, 0);
  const dailyAverageMm = totalMm / rainfallData.values.length;

  // Classify intensity based on daily average
  let intensityCategory: 'low' | 'moderate' | 'high' | 'extreme';
  let score = 0;

  if (dailyAverageMm > 50) {
    intensityCategory = 'extreme';
    score = 1.0; // >50mm/day: Extreme rainfall
  } else if (dailyAverageMm > 30) {
    intensityCategory = 'extreme';
    score = 0.85; // 30-50mm/day: Very heavy rainfall
  } else if (dailyAverageMm > 20) {
    intensityCategory = 'high';
    score = 0.7; // 20-30mm/day: Heavy rainfall
  } else if (dailyAverageMm > 10) {
    intensityCategory = 'high';
    score = 0.5; // 10-20mm/day: Moderate-heavy rainfall
  } else if (dailyAverageMm > 5) {
    intensityCategory = 'moderate';
    score = 0.3; // 5-10mm/day: Moderate rainfall
  } else {
    intensityCategory = 'low';
    score = 0.1; // <5mm/day: Light rainfall
  }

  // Additional weight for cumulative rainfall
  if (totalMm > 200) score = Math.min(1, score + 0.2); // >200mm cumulative
  else if (totalMm > 150) score = Math.min(1, score + 0.15);
  else if (totalMm > 100) score = Math.min(1, score + 0.1);

  return {
    score: Math.min(1, score),
    totalMm: parseFloat(totalMm.toFixed(1)),
    dailyAverageMm: parseFloat(dailyAverageMm.toFixed(1)),
    intensityCategory
  };
}

/**
 * Calculate terrain-based flood risk
 */
function calculateTerrainRisk(terrainData: {
  elevation: number;
  slope: number;
} | null): FloodRiskComponents['terrainCharacteristics'] {
  if (!terrainData) {
    return {
      score: 0.5, // Unknown = moderate risk
      elevation: 0,
      slope: 0,
      topographicIndex: 0
    };
  }

  const { elevation, slope } = terrainData;

  // Elevation risk (lower elevation = higher flood risk)
  // Rwanda elevation: 1000-4500m, low-lying areas < 1500m
  let elevationScore = 0;
  if (elevation < 1200) elevationScore = 0.9; // Valley floors
  else if (elevation < 1400) elevationScore = 0.7; // Low hills
  else if (elevation < 1600) elevationScore = 0.5; // Moderate elevation
  else if (elevation < 1800) elevationScore = 0.3; // Higher hills
  else elevationScore = 0.1; // Mountain areas

  // Slope risk (very flat = poor drainage, very steep = flash floods)
  let slopeScore = 0;
  if (slope < 2) slopeScore = 0.8; // Very flat - poor drainage
  else if (slope < 5) slopeScore = 0.5; // Gentle slope - moderate risk
  else if (slope < 10) slopeScore = 0.3; // Moderate slope - lower risk
  else if (slope < 20) slopeScore = 0.4; // Steep - runoff risk
  else slopeScore = 0.6; // Very steep - flash flood risk

  // Topographic Wetness Index (simplified)
  // TWI = ln(A / tan(slope))
  // Higher TWI = more likely to accumulate water
  const slopeRad = (slope * Math.PI) / 180;
  const twiContribution = slope > 0 ? Math.log(100 / Math.tan(slopeRad)) / 10 : 0.5;

  // Combine elevation and slope with TWI
  const score = (elevationScore * 0.5 + slopeScore * 0.3 + twiContribution * 0.2);

  return {
    score: Math.min(1, Math.max(0, score)),
    elevation: parseFloat(elevation.toFixed(1)),
    slope: parseFloat(slope.toFixed(1)),
    topographicIndex: parseFloat(twiContribution.toFixed(2))
  };
}

/**
 * Calculate vegetation cover flood risk
 */
function calculateVegetationCoverRisk(
  ndvi: number | null
): FloodRiskComponents['vegetationCover'] {
  if (ndvi === null) {
    return {
      score: 0.5,
      ndvi: 0,
      coverCategory: 'moderate'
    };
  }

  // Lower NDVI = less vegetation = more runoff = higher flood risk
  let coverCategory: 'bare' | 'sparse' | 'moderate' | 'dense';
  let score = 0;

  if (ndvi < 0.2) {
    coverCategory = 'bare';
    score = 0.9; // Bare soil - maximum runoff
  } else if (ndvi < 0.4) {
    coverCategory = 'sparse';
    score = 0.7; // Sparse vegetation - high runoff
  } else if (ndvi < 0.6) {
    coverCategory = 'moderate';
    score = 0.4; // Moderate vegetation - moderate runoff
  } else {
    coverCategory = 'dense';
    score = 0.1; // Dense vegetation - low runoff
  }

  return {
    score,
    ndvi: parseFloat(ndvi.toFixed(3)),
    coverCategory
  };
}

/**
 * Calculate historical flood frequency risk
 */
function calculateHistoricalFrequencyRisk(historicalEvents: any[]): FloodRiskComponents['historicalFrequency'] {
  const eventsPerYear = historicalEvents.length / 5; // Assuming 5-year history

  let score = 0;
  if (eventsPerYear >= 2) score = 1.0; // 2+ floods per year
  else if (eventsPerYear >= 1) score = 0.8; // 1 flood per year
  else if (eventsPerYear >= 0.5) score = 0.6; // 1 flood every 2 years
  else if (eventsPerYear > 0) score = 0.4; // Rare floods
  else score = 0.2; // No historical floods (still some base risk)

  let lastFloodDate: string | null = null;
  let daysSinceLastFlood: number | null = null;

  if (historicalEvents.length > 0) {
    const sortedEvents = historicalEvents.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    lastFloodDate = sortedEvents[0].date;
    daysSinceLastFlood = Math.floor(
      (Date.now() - new Date(lastFloodDate || "").getTime()) / (24 * 60 * 60 * 1000)
    );

    // Recent flood increases risk (soil saturation)
    if (daysSinceLastFlood < 30) score = Math.min(1, score + 0.2);
    else if (daysSinceLastFlood < 90) score = Math.min(1, score + 0.1);
  }

  return {
    score,
    eventsPerYear: parseFloat(eventsPerYear.toFixed(2)),
    lastFloodDate,
    daysSinceLastFlood
  };
}

/**
 * Generate actionable recommendations based on flood risk
 */
function generateRecommendations(riskData: {
  riskScore: number;
  severity: string;
  components: any;
}): string[] {
  const recommendations: string[] = [];

  if (riskData.severity === 'extreme' || riskData.severity === 'high') {
    recommendations.push('⚠️ High flood risk - Monitor weather alerts closely');
    recommendations.push('Prepare emergency evacuation plan');
    recommendations.push('Move valuable items to higher ground');
  }

  if (riskData.components.rainfallIntensity.score > 0.7) {
    recommendations.push('Heavy rainfall detected - Avoid low-lying areas');
    recommendations.push('Check drainage systems for blockages');
  }

  if (riskData.components.terrainCharacteristics.elevation < 1400) {
    recommendations.push('Location in flood-prone valley - Extra caution advised');
  }

  if (riskData.components.vegetationCover.coverCategory === 'bare' ||
      riskData.components.vegetationCover.coverCategory === 'sparse') {
    recommendations.push('Limited vegetation cover increases runoff risk');
    recommendations.push('Consider planting vegetation for long-term flood mitigation');
  }

  if (riskData.components.historicalFrequency.eventsPerYear > 0.5) {
    recommendations.push('Area has history of flooding - Review past events');
  }

  if (recommendations.length === 0) {
    recommendations.push('✓ Flood risk is currently low');
    recommendations.push('Continue monitoring weather conditions');
  }

  return recommendations;
}

/**
 * Calculate confidence score based on data availability
 */
function calculateConfidence(availability: {
  hasRainfall: boolean;
  hasTerrain: boolean;
  hasNDVI: boolean;
  hasHistorical: boolean;
}): number {
  let confidence = 0;
  if (availability.hasRainfall) confidence += 0.35;
  if (availability.hasTerrain) confidence += 0.30;
  if (availability.hasNDVI) confidence += 0.15;
  if (availability.hasHistorical) confidence += 0.20;

  return confidence;
}

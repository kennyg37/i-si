/**
 * Flood Prediction Calculator
 *
 * Uses past rainfall trends to produce a simple Flood Prediction Score
 * based on rainfall sum of last 7 days and historical patterns.
 *
 * Algorithm:
 * 1. Recent Rainfall (40% weight)
 *    - Sum of rainfall in last 7 days
 *    - Intensity trend (increasing/decreasing)
 *    - Antecedent moisture conditions
 *
 * 2. Historical Patterns (30% weight)
 *    - Seasonal rainfall patterns
 *    - Historical flood events during similar periods
 *    - Long-term precipitation trends
 *
 * 3. Terrain Factors (20% weight)
 *    - Elevation and slope (from OpenTopography)
 *    - Drainage characteristics
 *    - Topographic wetness index
 *
 * 4. Vegetation Cover (10% weight)
 *    - NDVI from Sentinel Hub
 *    - Vegetation affects runoff and infiltration
 *
 * Output: Flood Prediction Score (0-1) with confidence level
 */

import { nasaPowerAPI } from '../api/nasa-power';
import { openTopographyAPI } from '../api/opentopography';
import { gfmsAPI } from '../api/gfms';

export interface FloodPredictionInput {
  latitude: number;
  longitude: number;
  predictionDays: number; // How many days ahead to predict (default: 7)
}

export interface FloodPredictionComponents {
  recentRainfall: {
    score: number;
    last7Days: number; // mm
    trend: 'increasing' | 'decreasing' | 'stable';
    intensity: number; // mm/day average
  };
  historicalPatterns: {
    score: number;
    seasonalRisk: number;
    historicalFloods: number; // count in similar periods
    longTermTrend: number;
  };
  terrainFactors: {
    score: number;
    elevation: number; // meters
    slope: number; // degrees
    drainageRisk: number;
  };
  vegetationCover: {
    score: number;
    ndvi: number;
    runoffPotential: number;
  };
}

export interface FloodPredictionResult {
  predictionScore: number; // 0-1 scale
  confidence: number; // 0-1 scale
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  components: FloodPredictionComponents;
  recommendations: string[];
  predictedFloodRisk: {
    next24h: number;
    next3days: number;
    next7days: number;
  };
  timestamp: string;
}

/**
 * Calculate flood prediction score for a location
 */
export async function calculateFloodPrediction(
  input: FloodPredictionInput
): Promise<FloodPredictionResult> {
  const { latitude, longitude } = input;

  console.log(`[FloodPrediction] Calculating for: ${latitude}, ${longitude}`);

  // Calculate date ranges
  const endDate = new Date();
  const startDate7 = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDate30 = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate90 = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Fetch all required data in parallel
  const [recentRainfall, historicalRainfall, terrainData, ndviData, historicalFloods] = await Promise.all([
    fetchRainfallData(latitude, longitude, startDate7, endDate),
    fetchRainfallData(latitude, longitude, startDate90, startDate30),
    fetchTerrainData(latitude, longitude),
    fetchNDVIData(),
    fetchHistoricalFloods(latitude, longitude, startDate90, endDate)
  ]);

  // Calculate individual components
  const recentRainfallComponent = calculateRecentRainfallRisk(recentRainfall);
  const historicalPatternsComponent = calculateHistoricalPatternsRisk(historicalRainfall, historicalFloods);
  const terrainFactorsComponent = calculateTerrainFactorsRisk(terrainData);
  const vegetationCoverComponent = calculateVegetationCoverRisk(ndviData);

  // Combine components with weights
  const weights = {
    recentRainfall: 0.40,
    historicalPatterns: 0.30,
    terrainFactors: 0.20,
    vegetationCover: 0.10
  };

  const predictionScore =
    recentRainfallComponent.score * weights.recentRainfall +
    historicalPatternsComponent.score * weights.historicalPatterns +
    terrainFactorsComponent.score * weights.terrainFactors +
    vegetationCoverComponent.score * weights.vegetationCover;

  // Classify severity
  let severity: FloodPredictionResult['severity'];
  if (predictionScore >= 0.8) severity = 'extreme';
  else if (predictionScore >= 0.6) severity = 'high';
  else if (predictionScore >= 0.4) severity = 'moderate';
  else severity = 'low';

  // Calculate confidence based on data quality
  const confidence = calculateConfidence({
    hasRecentRainfall: recentRainfall.length > 0,
    hasHistoricalRainfall: historicalRainfall.length > 0,
    hasTerrainData: terrainData !== null,
    hasNDVI: ndviData !== null,
    hasHistoricalFloods: historicalFloods.length > 0
  });

  // Generate time-based predictions
  const predictedFloodRisk = generateTimeBasedPredictions(predictionScore, recentRainfallComponent);

  // Generate recommendations
  const recommendations = generateRecommendations({
    predictionScore,
    severity,
    components: {
      recentRainfall: recentRainfallComponent,
      historicalPatterns: historicalPatternsComponent,
      terrainFactors: terrainFactorsComponent,
      vegetationCover: vegetationCoverComponent
    }
  });

  return {
    predictionScore: Math.min(1, Math.max(0, predictionScore)),
    confidence,
    severity,
    components: {
      recentRainfall: recentRainfallComponent,
      historicalPatterns: historicalPatternsComponent,
      terrainFactors: terrainFactorsComponent,
      vegetationCover: vegetationCoverComponent
    },
    recommendations,
    predictedFloodRisk,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetch rainfall data from NASA POWER API
 */
async function fetchRainfallData(
  lat: number,
  lon: number,
  startDate: Date,
  endDate: Date
): Promise<number[]> {
  try {
    const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
    
    const data = await nasaPowerAPI.getRainfallData(lat, lon, startStr, endStr);
    
    if (!data?.properties?.parameter?.PRECTOTCORR) {
      return [];
    }

    return Object.values(data.properties.parameter.PRECTOTCORR)
      .filter((p): p is number => typeof p === 'number' && p >= 0);
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    return [];
  }
}

/**
 * Fetch terrain data from OpenTopography API
 */
async function fetchTerrainData(lat: number, lon: number) {
  try {
    return await openTopographyAPI.getPointElevation(lat, lon, 1);
  } catch (error) {
    console.error('Error fetching terrain data:', error);
    return null;
  }
}

/**
 * Fetch NDVI data from Sentinel Hub API
 * Disabled temporarily due to Sentinel Hub configuration issues
 */
async function fetchNDVIData() {
  // Return null to skip NDVI data fetching
  // Re-enable when Sentinel Hub credentials are configured
  return null;
}

/**
 * Fetch historical flood data from GFMS API
 */
async function fetchHistoricalFloods(
  lat: number,
  lon: number,
  startDate: Date,
  endDate: Date
) {
  try {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return await gfmsAPI.getHistoricalFloods(lat, lon, startStr, endStr);
  } catch (error) {
    console.error('Error fetching historical floods:', error);
    return [];
  }
}

/**
 * Calculate recent rainfall risk component
 */
function calculateRecentRainfallRisk(rainfallData: number[]) {
  if (rainfallData.length === 0) {
    return {
      score: 0,
      last7Days: 0,
      trend: 'stable' as const,
      intensity: 0
    };
  }

  const last7Days = rainfallData.slice(-7);
  const totalRainfall = last7Days.reduce((sum, val) => sum + val, 0);
  const intensity = totalRainfall / 7; // mm/day

  // Calculate trend
  const firstHalf = rainfallData.slice(0, Math.floor(rainfallData.length / 2));
  const secondHalf = rainfallData.slice(Math.floor(rainfallData.length / 2));
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (secondAvg > firstAvg + 2) trend = 'increasing';
  else if (secondAvg < firstAvg - 2) trend = 'decreasing';

  // Calculate risk score based on intensity and trend
  let score = 0;

  // Only add score if there's actual rainfall
  if (intensity > 20) score += 0.6; // Very high intensity
  else if (intensity > 15) score += 0.4; // High intensity
  else if (intensity > 10) score += 0.2; // Moderate intensity
  else if (intensity > 5) score += 0.1; // Light intensity

  // Trend only matters if there's significant rainfall
  if (intensity > 5) {
    if (trend === 'increasing') score += 0.3;
    else if (trend === 'stable') score += 0.05; // Very low contribution for stable low rain
  }

  return {
    score: Math.min(1, score),
    last7Days: totalRainfall,
    trend,
    intensity
  };
}

/**
 * Calculate historical patterns risk component
 */
function calculateHistoricalPatternsRisk(
  historicalRainfall: number[],
  historicalFloods: any[]
) {
  const historicalAvg = historicalRainfall.length > 0
    ? historicalRainfall.reduce((sum, val) => sum + val, 0) / historicalRainfall.length
    : 0;

  const seasonalRisk = calculateSeasonalRisk();
  const historicalFloodCount = historicalFloods.length;
  const longTermTrend = calculateLongTermTrend(historicalRainfall);

  let score = 0;

  // Seasonal risk only contributes if there's actual rainfall above threshold
  // This prevents dry areas from showing high risk just because it's rainy season
  if (historicalAvg > 5) { // Only if avg rainfall > 5mm/day
    score += seasonalRisk * 0.4;
  }

  // Historical flood frequency
  if (historicalFloodCount > 5) score += 0.4;
  else if (historicalFloodCount > 2) score += 0.2;
  else if (historicalFloodCount > 0) score += 0.1;

  // Long-term trend (only if positive trend)
  if (longTermTrend > 0) {
    score += longTermTrend * 0.2;
  }

  return {
    score: Math.min(1, score),
    seasonalRisk,
    historicalFloods: historicalFloodCount,
    longTermTrend
  };
}

/**
 * Calculate terrain factors risk component
 */
function calculateTerrainFactorsRisk(terrainData: any) {
  if (!terrainData) {
    return {
      score: 0, // No data = no contribution to risk
      elevation: 0,
      slope: 0,
      drainageRisk: 0
    };
  }

  const elevation = terrainData.elevation || 0;
  const slope = terrainData.slope || 0;

  let score = 0;
  
  // Lower elevation = higher flood risk
  if (elevation < 1000) score += 0.4;
  else if (elevation < 1500) score += 0.2;
  else if (elevation < 2000) score += 0.1;

  // Steeper slopes upstream = faster runoff
  if (slope > 15) score += 0.3;
  else if (slope > 10) score += 0.2;
  else if (slope > 5) score += 0.1;

  // Drainage risk (simplified)
  const drainageRisk = elevation < 1200 ? 0.8 : elevation < 1500 ? 0.5 : 0.2;
  score += drainageRisk * 0.3;

  return {
    score: Math.min(1, score),
    elevation,
    slope,
    drainageRisk
  };
}

/**
 * Calculate vegetation cover risk component
 */
function calculateVegetationCoverRisk(ndviData: number | null) {
  if (ndviData === null) {
    return {
      score: 0, // No data = no contribution to risk
      ndvi: 0,
      runoffPotential: 0
    };
  }

  // Lower NDVI = less vegetation = higher runoff potential
  const runoffPotential = Math.max(0, 1 - ndviData);
  const score = runoffPotential * 0.8; // Vegetation has significant impact

  return {
    score: Math.min(1, score),
    ndvi: ndviData,
    runoffPotential
  };
}

/**
 * Calculate seasonal risk based on current date
 */
function calculateSeasonalRisk(): number {
  const month = new Date().getMonth() + 1; // 1-12
  
  // Rwanda has two rainy seasons: March-May and October-December
  if (month >= 3 && month <= 5) return 0.8; // Long rainy season
  if (month >= 10 && month <= 12) return 0.7; // Short rainy season
  if (month >= 6 && month <= 9) return 0.3; // Long dry season
  return 0.4; // Short dry season
}

/**
 * Calculate long-term precipitation trend
 */
function calculateLongTermTrend(rainfallData: number[]): number {
  if (rainfallData.length < 10) return 0;

  const firstThird = rainfallData.slice(0, Math.floor(rainfallData.length / 3));
  const lastThird = rainfallData.slice(-Math.floor(rainfallData.length / 3));
  
  const firstAvg = firstThird.reduce((sum, val) => sum + val, 0) / firstThird.length;
  const lastAvg = lastThird.reduce((sum, val) => sum + val, 0) / lastThird.length;
  
  const trend = (lastAvg - firstAvg) / firstAvg;
  return Math.max(-1, Math.min(1, trend)); // Normalize to -1 to 1
}

/**
 * Calculate confidence based on data availability
 */
function calculateConfidence(dataQuality: {
  hasRecentRainfall: boolean;
  hasHistoricalRainfall: boolean;
  hasTerrainData: boolean;
  hasNDVI: boolean;
  hasHistoricalFloods: boolean;
}): number {
  let confidence = 0;
  
  if (dataQuality.hasRecentRainfall) confidence += 0.3;
  if (dataQuality.hasHistoricalRainfall) confidence += 0.2;
  if (dataQuality.hasTerrainData) confidence += 0.2;
  if (dataQuality.hasNDVI) confidence += 0.15;
  if (dataQuality.hasHistoricalFloods) confidence += 0.15;

  return Math.min(1, confidence);
}

/**
 * Generate time-based flood risk predictions
 */
function generateTimeBasedPredictions(
  baseScore: number,
  recentRainfall: any
): { next24h: number; next3days: number; next7days: number } {
  const trendMultiplier = recentRainfall.trend === 'increasing' ? 1.2 : 
                         recentRainfall.trend === 'decreasing' ? 0.8 : 1.0;

  return {
    next24h: Math.min(1, baseScore * trendMultiplier),
    next3days: Math.min(1, baseScore * trendMultiplier * 0.9),
    next7days: Math.min(1, baseScore * trendMultiplier * 0.8)
  };
}

/**
 * Generate recommendations based on prediction results
 */
function generateRecommendations(data: {
  predictionScore: number;
  severity: string;
  components: any;
}): string[] {
  const recommendations: string[] = [];

  if (data.severity === 'extreme') {
    recommendations.push('Immediate evacuation may be necessary');
    recommendations.push('Monitor water levels continuously');
    recommendations.push('Prepare emergency supplies and evacuation routes');
  } else if (data.severity === 'high') {
    recommendations.push('Prepare for potential flooding');
    recommendations.push('Move valuables to higher ground');
    recommendations.push('Monitor weather updates closely');
  } else if (data.severity === 'moderate') {
    recommendations.push('Stay alert for changing conditions');
    recommendations.push('Prepare basic emergency supplies');
    recommendations.push('Check drainage systems');
  } else {
    recommendations.push('Continue normal monitoring');
    recommendations.push('Maintain basic preparedness');
  }

  // Component-specific recommendations
  if (data.components.recentRainfall.intensity > 15) {
    recommendations.push('High rainfall intensity detected - monitor closely');
  }

  if (data.components.terrainFactors.elevation < 1000) {
    recommendations.push('Low elevation area - higher flood risk');
  }

  if (data.components.vegetationCover.ndvi < 0.3) {
    recommendations.push('Low vegetation cover increases runoff risk');
  }

  return recommendations;
}
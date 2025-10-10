/**
 * Landslide Risk Index Calculator
 *
 * Comprehensive landslide susceptibility assessment for Rwanda
 *
 * Based on NASA LHASA (Landslide Hazard Assessment for Situational Awareness) methodology
 * and Rwanda-specific landslide research
 *
 * Risk Factors (weighted):
 * 1. Slope angle (35%) - Steeper slopes = higher risk
 * 2. Rainfall intensity (30%) - Heavy/prolonged rain = trigger
 * 3. Soil saturation (20%) - Wet soil = instability
 * 4. Historical density (15%) - Past events = future risk
 *
 * Sources:
 * - NASA LHASA Model: https://pmm.nasa.gov/applications/lhasa
 * - Rwanda landslide studies
 * - USGS landslide guidelines
 */

import { calculateLandslideDensity, assessCurrentLandslideTrigger } from '../api/nasa-landslide';

export interface LandslideRiskFactors {
  // Terrain factors
  slope: number; // degrees (0-90)
  elevation: number; // meters
  aspect?: number; // slope direction (0-360)

  // Hydrological factors
  rainfall24h: number; // mm in last 24 hours
  rainfall72h: number; // mm in last 72 hours
  rainfall7d: number; // mm in last 7 days
  soilMoisture: number; // 0-1 scale (from NDWI or soil moisture data)

  // Historical factors
  historicalDensity: number; // landslides per 100 km² (from NASA catalog)
  distanceToNearestEvent?: number; // km

  // Environmental factors
  ndvi?: number; // Vegetation cover (0-1)
  landCover?: string; // forest, agriculture, urban, bare
}

export interface LandslideRiskResult {
  riskScore: number; // 0-1 overall risk
  riskCategory: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
  componentScores: {
    slopeRisk: number; // 0-1
    rainfallRisk: number; // 0-1
    soilRisk: number; // 0-1
    historicalRisk: number; // 0-1
  };
  triggers: {
    active: boolean;
    type: string[]; // ['rainfall', 'earthquake', etc.]
    triggerRisk: number; // 0-1
  };
  warnings: string[];
  recommendations: string[];
}

/**
 * Calculate comprehensive landslide risk score
 */
export function calculateLandslideRisk(factors: LandslideRiskFactors): LandslideRiskResult {
  // 1. Slope Risk (35% weight)
  const slopeRisk = calculateSlopeRisk(factors.slope, factors.aspect);

  // 2. Rainfall Risk (30% weight)
  const rainfallRisk = calculateRainfallRisk(
    factors.rainfall24h,
    factors.rainfall72h,
    factors.rainfall7d
  );

  // 3. Soil Saturation Risk (20% weight)
  const soilRisk = calculateSoilSaturationRisk(
    factors.soilMoisture,
    factors.rainfall72h,
    factors.ndvi
  );

  // 4. Historical Risk (15% weight)
  const historicalRisk = calculateHistoricalRisk(factors.historicalDensity);

  // Weighted combination
  const riskScore =
    slopeRisk * 0.35 +
    rainfallRisk * 0.30 +
    soilRisk * 0.20 +
    historicalRisk * 0.15;

  // Determine risk category
  const riskCategory = getRiskCategory(riskScore);

  // Assess current triggers
  const triggerAssessment = assessCurrentLandslideTrigger(factors.rainfall72h);

  // Generate warnings and recommendations
  const { warnings, recommendations } = generateWarningsAndRecommendations(
    riskScore,
    factors,
    triggerAssessment
  );

  return {
    riskScore: Math.min(1, Math.max(0, riskScore)),
    riskCategory,
    componentScores: {
      slopeRisk,
      rainfallRisk,
      soilRisk,
      historicalRisk,
    },
    triggers: {
      active: triggerAssessment.triggeredByRain || triggerAssessment.triggeredByEarthquake,
      type: [
        ...(triggerAssessment.triggeredByRain ? ['rainfall'] : []),
        ...(triggerAssessment.triggeredByEarthquake ? ['earthquake'] : []),
      ],
      triggerRisk: triggerAssessment.triggerRisk,
    },
    warnings,
    recommendations,
  };
}

/**
 * Calculate slope-based risk
 * Research shows:
 * - 0-15°: Very low risk
 * - 15-25°: Low to moderate risk
 * - 25-35°: Moderate to high risk
 * - 35-45°: High to very high risk
 * - >45°: Extreme risk
 */
function calculateSlopeRisk(slope: number, aspect?: number): number {
  let risk = 0;

  if (slope >= 45) {
    risk = 1.0; // Extreme risk
  } else if (slope >= 35) {
    risk = 0.8; // Very high risk
  } else if (slope >= 25) {
    risk = 0.6; // High risk
  } else if (slope >= 15) {
    risk = 0.35; // Moderate risk
  } else if (slope >= 10) {
    risk = 0.15; // Low risk
  } else {
    risk = 0.05; // Very low risk
  }

  // Aspect modifier (slopes facing certain directions may be more prone)
  // North-facing slopes in tropics may retain more moisture
  if (aspect !== undefined) {
    const isNorthFacing = aspect >= 315 || aspect <= 45;
    if (isNorthFacing && slope > 20) {
      risk *= 1.1; // 10% increase for north-facing steep slopes
    }
  }

  return Math.min(1, risk);
}

/**
 * Calculate rainfall-based trigger risk
 * Rwanda landslide thresholds (from research):
 * - 24h: >50mm = trigger possible
 * - 72h: >100mm = high trigger risk
 * - 7 days: >150mm = very high trigger risk
 */
function calculateRainfallRisk(
  rainfall24h: number,
  rainfall72h: number,
  rainfall7d: number
): number {
  let risk = 0;

  // 24-hour intensity
  if (rainfall24h > 100) risk += 0.4;
  else if (rainfall24h > 75) risk += 0.3;
  else if (rainfall24h > 50) risk += 0.2;
  else if (rainfall24h > 30) risk += 0.1;

  // 72-hour cumulative
  if (rainfall72h > 200) risk += 0.5;
  else if (rainfall72h > 150) risk += 0.4;
  else if (rainfall72h > 100) risk += 0.3;
  else if (rainfall72h > 75) risk += 0.2;

  // 7-day trend (antecedent moisture)
  if (rainfall7d > 300) risk += 0.3;
  else if (rainfall7d > 200) risk += 0.2;
  else if (rainfall7d > 150) risk += 0.1;

  return Math.min(1, risk);
}

/**
 * Calculate soil saturation risk
 * Combines soil moisture content with recent rainfall
 */
function calculateSoilSaturationRisk(
  soilMoisture: number,
  rainfall72h: number,
  ndvi?: number
): number {
  let risk = soilMoisture; // Base risk from soil moisture (0-1)

  // Recent rainfall increases saturation risk
  if (rainfall72h > 100) {
    risk += 0.3;
  } else if (rainfall72h > 50) {
    risk += 0.2;
  }

  // Vegetation cover (NDVI) can reduce risk (roots stabilize soil)
  if (ndvi !== undefined) {
    if (ndvi > 0.6) {
      // Dense vegetation
      risk *= 0.8; // 20% reduction
    } else if (ndvi < 0.2) {
      // Bare soil or sparse vegetation
      risk *= 1.2; // 20% increase
    }
  }

  return Math.min(1, risk);
}

/**
 * Calculate historical risk based on past landslide density
 */
function calculateHistoricalRisk(densityPer100km: number): number {
  // Density-based risk (events per 100 km²)
  if (densityPer100km >= 2.0) return 1.0; // Very high historical activity
  if (densityPer100km >= 1.0) return 0.75;
  if (densityPer100km >= 0.5) return 0.5;
  if (densityPer100km >= 0.2) return 0.3;
  if (densityPer100km > 0) return 0.15;
  return 0.05; // No recorded events (but not zero risk)
}

/**
 * Determine risk category from score
 */
function getRiskCategory(score: number): 'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' {
  if (score >= 0.9) return 'extreme';
  if (score >= 0.75) return 'very_high';
  if (score >= 0.6) return 'high';
  if (score >= 0.4) return 'moderate';
  if (score >= 0.2) return 'low';
  return 'very_low';
}

/**
 * Generate contextual warnings and recommendations
 */
function generateWarningsAndRecommendations(
  riskScore: number,
  factors: LandslideRiskFactors,
  triggerAssessment: ReturnType<typeof assessCurrentLandslideTrigger>
): { warnings: string[]; recommendations: string[] } {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Critical warnings
  if (riskScore >= 0.75) {
    warnings.push('🚨 EXTREME LANDSLIDE RISK - Immediate action required');

    if (factors.slope > 30) {
      warnings.push(`Very steep slope (${factors.slope.toFixed(1)}°) - High instability`);
    }

    if (factors.rainfall72h > 100) {
      warnings.push(`Heavy rainfall (${factors.rainfall72h.toFixed(0)}mm/72h) - Landslide trigger threshold exceeded`);
    }

    recommendations.push('EVACUATE if living on or below steep slopes');
    recommendations.push('Avoid hillside roads and paths');
    recommendations.push('Monitor for cracks in ground, tilting trees, or unusual water flow');
    recommendations.push('Contact local authorities (dial 112) if landslide signs observed');
  } else if (riskScore >= 0.6) {
    warnings.push('⚠️ HIGH LANDSLIDE RISK - Exercise extreme caution');

    recommendations.push('Avoid steep slopes and unstable hillsides');
    recommendations.push('Prepare evacuation plan if living in hilly areas');
    recommendations.push('Monitor weather forecasts for additional rainfall');
    recommendations.push('Watch for landslide warning signs (cracks, unusual sounds)');
  } else if (riskScore >= 0.4) {
    warnings.push('⚡ MODERATE LANDSLIDE RISK - Stay alert');

    recommendations.push('Be aware of surroundings in hilly terrain');
    recommendations.push('Avoid construction on steep slopes during rainy season');
    recommendations.push('Ensure proper drainage around buildings on slopes');
  } else if (riskScore >= 0.2) {
    recommendations.push('Monitor conditions if living in hilly areas');
    recommendations.push('Maintain vegetation cover on slopes for stability');
  }

  // Trigger-specific warnings
  if (triggerAssessment.triggeredByRain) {
    warnings.push('⛈️ Active rainfall trigger - Landslide possible');
  }

  if (triggerAssessment.triggeredByEarthquake) {
    warnings.push('🌍 Recent seismic activity - Slopes may be destabilized');
  }

  // Historical context
  if (factors.historicalDensity > 0.5) {
    warnings.push(`📊 ${factors.historicalDensity.toFixed(1)} landslides per 100km² historically - High-risk zone`);
    recommendations.push('Consult historical landslide maps before development');
  }

  // Soil moisture warnings
  if (factors.soilMoisture > 0.7) {
    warnings.push('💧 High soil saturation - Reduced slope stability');
  }

  return { warnings, recommendations };
}

/**
 * Quick landslide risk assessment (simplified version)
 * Use this for rapid calculations on map
 */
export function quickLandslideRisk(slope: number, rainfall72h: number): number {
  const slopeComponent = Math.min(1, slope / 45);
  const rainComponent = Math.min(1, rainfall72h / 150);

  return (slopeComponent * 0.6 + rainComponent * 0.4);
}

/**
 * Get color for risk visualization
 */
export function getLandslideRiskColor(riskScore: number): string {
  if (riskScore >= 0.9) return '#8B0000'; // Dark red - Extreme
  if (riskScore >= 0.75) return '#FF0000'; // Red - Very High
  if (riskScore >= 0.6) return '#FF6600'; // Orange-red - High
  if (riskScore >= 0.4) return '#FFA500'; // Orange - Moderate
  if (riskScore >= 0.2) return '#FFD700'; // Yellow - Low
  return '#90EE90'; // Light green - Very Low
}

/**
 * Calculate landslide risk for a location using all available data
 */
export async function calculateLandslideRiskForLocation(
  lat: number,
  lon: number,
  slope: number,
  rainfall24h: number,
  rainfall72h: number,
  rainfall7d: number,
  soilMoisture: number,
  ndvi?: number
): Promise<LandslideRiskResult> {
  // Get historical landslide density from NASA catalog
  const densityData = await calculateLandslideDensity(lat, lon, 25);

  const factors: LandslideRiskFactors = {
    slope,
    elevation: 0, // Would be fetched from DEM
    rainfall24h,
    rainfall72h,
    rainfall7d,
    soilMoisture,
    historicalDensity: densityData.density,
    ndvi,
  };

  return calculateLandslideRisk(factors);
}

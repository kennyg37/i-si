/**
 * Drought Risk Index Calculator
 *
 * Combines multiple data sources to calculate comprehensive drought risk:
 * - NASA POWER: Temperature and precipitation data
 * - Sentinel Hub: NDVI (vegetation health)
 * - Historical data: Long-term climate patterns
 *
 * Algorithm:
 * 1. Precipitation Deficit (40% weight)
 *    - Compare recent rainfall to historical average
 *    - Calculate Standardized Precipitation Index (SPI)
 *
 * 2. Temperature Anomaly (25% weight)
 *    - Higher than normal temperatures increase evapotranspiration
 *    - Heat stress on vegetation
 *
 * 3. Vegetation Health (25% weight)
 *    - NDVI values indicate vegetation stress
 *    - Lower NDVI = higher drought risk
 *
 * 4. Soil Moisture (10% weight)
 *    - Derived from NDWI (Normalized Difference Water Index)
 *    - Lower soil moisture = higher risk
 *
 * Output: Drought Risk Score (0-1) with severity classification
 */

import { nasaPowerAPI } from '../api/nasa-power';
import { sentinelHubAPI } from '../api/sentinel-hub';

export interface DroughtRiskInput {
  latitude: number;
  longitude: number;
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
}

export interface DroughtRiskComponents {
  precipitationDeficit: {
    score: number; // 0-1
    actualMm: number;
    normalMm: number;
    anomalyPercent: number;
  };
  temperatureAnomaly: {
    score: number; // 0-1
    actualC: number;
    normalC: number;
    anomalyC: number;
  };
  vegetationHealth: {
    score: number; // 0-1
    ndvi: number; // -1 to 1
    ndviAnomaly: number;
  };
  soilMoisture: {
    score: number; // 0-1
    ndwi: number; // -1 to 1
  };
}

export interface DroughtRiskResult {
  riskScore: number; // 0-1 (0 = no drought, 1 = extreme drought)
  severity: 'none' | 'mild' | 'moderate' | 'severe' | 'extreme';
  confidence: number; // 0-1
  components: DroughtRiskComponents;
  timestamp: string;
}

/**
 * Calculate comprehensive drought risk for a location
 */
export async function calculateDroughtRisk(
  input: DroughtRiskInput
): Promise<DroughtRiskResult> {
  const { latitude, longitude, startDate, endDate } = input;

  console.log(`[DroughtRisk] Calculating for: ${latitude}, ${longitude}`);

  // Fetch all required data in parallel
  const [rainfallData, temperatureData, ndviValue, ndwiValue] = await Promise.all([
    fetchRainfallData(latitude, longitude, startDate, endDate),
    fetchTemperatureData(latitude, longitude, startDate, endDate),
    fetchNDVI(latitude, longitude),
    fetchNDWI(latitude, longitude)
  ]);

  // Calculate individual components
  const precipitationDeficit = calculatePrecipitationDeficit(rainfallData);
  const temperatureAnomaly = calculateTemperatureAnomaly(temperatureData);
  const vegetationHealth = calculateVegetationHealth(ndviValue);
  const soilMoisture = calculateSoilMoisture(ndwiValue);

  // Combine components with weights
  const weights = {
    precipitation: 0.40,
    temperature: 0.25,
    vegetation: 0.25,
    soilMoisture: 0.10
  };

  const riskScore =
    precipitationDeficit.score * weights.precipitation +
    temperatureAnomaly.score * weights.temperature +
    vegetationHealth.score * weights.vegetation +
    soilMoisture.score * weights.soilMoisture;

  // Classify severity
  let severity: DroughtRiskResult['severity'];
  if (riskScore >= 0.8) severity = 'extreme';
  else if (riskScore >= 0.6) severity = 'severe';
  else if (riskScore >= 0.4) severity = 'moderate';
  else if (riskScore >= 0.2) severity = 'mild';
  else severity = 'none';

  // Calculate confidence based on data quality
  const confidence = calculateConfidence({
    hasRainfall: rainfallData.values.length > 0,
    hasTemperature: temperatureData.values.length > 0,
    hasNDVI: ndviValue !== null,
    hasNDWI: ndwiValue !== null
  });

  return {
    riskScore: Math.min(1, Math.max(0, riskScore)),
    severity,
    confidence,
    components: {
      precipitationDeficit,
      temperatureAnomaly,
      vegetationHealth,
      soilMoisture
    },
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
    const values = data.properties?.parameter?.PRECTOTCORR
      ? Object.values(data.properties.parameter.PRECTOTCORR).filter(
          (p): p is number => typeof p === 'number' && p >= 0
        )
      : [];

    return { values, data };
  } catch (error) {
    console.error('[DroughtRisk] Error fetching rainfall:', error);
    return { values: [], data: null };
  }
}

/**
 * Fetch temperature data from NASA POWER
 */
async function fetchTemperatureData(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) {
  try {
    const data = await nasaPowerAPI.getTemperatureData(lat, lon, startDate, endDate);
    const values = data.properties?.parameter?.T2M
      ? Object.values(data.properties.parameter.T2M).filter(
          (t): t is number => typeof t === 'number' && !isNaN(t)
        )
      : [];

    return { values, data };
  } catch (error) {
    console.error('[DroughtRisk] Error fetching temperature:', error);
    return { values: [], data: null };
  }
}

/**
 * Fetch NDVI from Sentinel Hub
 */
async function fetchNDVI(lat: number, lon: number): Promise<number | null> {
  try {
    // Create small bbox around point (0.01 degrees ≈ 1km)
    const bbox: [number, number, number, number] = [
      lon - 0.005,
      lat - 0.005,
      lon + 0.005,
      lat + 0.005
    ];

    // For now, return mock NDVI value
    // In production, parse actual Sentinel Hub response
    const mockNDVI = 0.3 + Math.random() * 0.5; // 0.3-0.8 (typical for Rwanda)
    return mockNDVI;
  } catch (error) {
    console.error('[DroughtRisk] Error fetching NDVI:', error);
    return null;
  }
}

/**
 * Fetch NDWI from Sentinel Hub
 */
async function fetchNDWI(lat: number, lon: number): Promise<number | null> {
  try {
    // NDWI = (Green - NIR) / (Green + NIR)
    // For now, return mock value
    const mockNDWI = 0.1 + Math.random() * 0.3; // 0.1-0.4 (typical for vegetated areas)
    return mockNDWI;
  } catch (error) {
    console.error('[DroughtRisk] Error fetching NDWI:', error);
    return null;
  }
}

/**
 * Calculate precipitation deficit score
 * Based on Standardized Precipitation Index (SPI) methodology
 */
function calculatePrecipitationDeficit(rainfallData: {
  values: number[];
  data: any;
}): DroughtRiskComponents['precipitationDeficit'] {
  if (rainfallData.values.length === 0) {
    return {
      score: 0.5, // Unknown = moderate risk
      actualMm: 0,
      normalMm: 0,
      anomalyPercent: 0
    };
  }

  const actualMm = rainfallData.values.reduce((sum, val) => sum + val, 0);
  const avgDailyMm = actualMm / rainfallData.values.length;

  // Rwanda normal rainfall: ~1000-1400mm/year = ~2.7-3.8mm/day
  const normalDailyMm = 3.2;
  const normalMm = normalDailyMm * rainfallData.values.length;

  const anomalyPercent = ((actualMm - normalMm) / normalMm) * 100;

  // Calculate score (higher anomaly negative = higher drought risk)
  let score = 0;
  if (anomalyPercent < -70) score = 1.0; // Extreme deficit
  else if (anomalyPercent < -50) score = 0.85; // Severe deficit
  else if (anomalyPercent < -30) score = 0.65; // Moderate deficit
  else if (anomalyPercent < -15) score = 0.45; // Mild deficit
  else if (anomalyPercent < 0) score = 0.25; // Slight deficit
  else score = 0; // Normal or above

  return {
    score,
    actualMm: parseFloat(actualMm.toFixed(1)),
    normalMm: parseFloat(normalMm.toFixed(1)),
    anomalyPercent: parseFloat(anomalyPercent.toFixed(1))
  };
}

/**
 * Calculate temperature anomaly score
 */
function calculateTemperatureAnomaly(temperatureData: {
  values: number[];
  data: any;
}): DroughtRiskComponents['temperatureAnomaly'] {
  if (temperatureData.values.length === 0) {
    return {
      score: 0.5,
      actualC: 0,
      normalC: 0,
      anomalyC: 0
    };
  }

  const actualC = temperatureData.values.reduce((sum, val) => sum + val, 0) / temperatureData.values.length;

  // Rwanda normal temperature: ~15-25°C depending on elevation
  const normalC = 20;
  const anomalyC = actualC - normalC;

  // Calculate score (higher than normal = higher drought risk)
  let score = 0;
  if (anomalyC > 5) score = 1.0; // Extreme heat
  else if (anomalyC > 3) score = 0.75; // Severe heat
  else if (anomalyC > 2) score = 0.5; // Moderate heat
  else if (anomalyC > 1) score = 0.3; // Mild heat
  else if (anomalyC > 0) score = 0.15; // Slight heat
  else score = 0; // Normal or below

  return {
    score,
    actualC: parseFloat(actualC.toFixed(1)),
    normalC,
    anomalyC: parseFloat(anomalyC.toFixed(1))
  };
}

/**
 * Calculate vegetation health score from NDVI
 */
function calculateVegetationHealth(ndvi: number | null): DroughtRiskComponents['vegetationHealth'] {
  if (ndvi === null) {
    return {
      score: 0.5,
      ndvi: 0,
      ndviAnomaly: 0
    };
  }

  // Normal NDVI for healthy vegetation in Rwanda: 0.6-0.8
  const normalNDVI = 0.7;
  const ndviAnomaly = ndvi - normalNDVI;

  // Calculate score (lower NDVI = higher drought stress)
  let score = 0;
  if (ndvi < 0.2) score = 1.0; // Extreme stress (bare soil)
  else if (ndvi < 0.3) score = 0.85; // Severe stress
  else if (ndvi < 0.4) score = 0.65; // Moderate stress
  else if (ndvi < 0.5) score = 0.45; // Mild stress
  else if (ndvi < 0.6) score = 0.25; // Slight stress
  else score = 0; // Healthy vegetation

  return {
    score,
    ndvi: parseFloat(ndvi.toFixed(3)),
    ndviAnomaly: parseFloat(ndviAnomaly.toFixed(3))
  };
}

/**
 * Calculate soil moisture score from NDWI
 */
function calculateSoilMoisture(ndwi: number | null): DroughtRiskComponents['soilMoisture'] {
  if (ndwi === null) {
    return {
      score: 0.5,
      ndwi: 0
    };
  }

  // NDWI interpretation:
  // > 0.3: Water bodies
  // 0.1 - 0.3: Moist soil/vegetation
  // 0 - 0.1: Moderate moisture
  // < 0: Dry soil

  let score = 0;
  if (ndwi < -0.2) score = 1.0; // Extremely dry
  else if (ndwi < -0.1) score = 0.8; // Very dry
  else if (ndwi < 0) score = 0.6; // Dry
  else if (ndwi < 0.1) score = 0.4; // Moderate
  else if (ndwi < 0.2) score = 0.2; // Moist
  else score = 0; // Wet

  return {
    score,
    ndwi: parseFloat(ndwi.toFixed(3))
  };
}

/**
 * Calculate confidence score based on data availability
 */
function calculateConfidence(availability: {
  hasRainfall: boolean;
  hasTemperature: boolean;
  hasNDVI: boolean;
  hasNDWI: boolean;
}): number {
  let confidence = 0;
  if (availability.hasRainfall) confidence += 0.4;
  if (availability.hasTemperature) confidence += 0.25;
  if (availability.hasNDVI) confidence += 0.25;
  if (availability.hasNDWI) confidence += 0.1;

  return confidence;
}

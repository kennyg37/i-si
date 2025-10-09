/**
 * Type definitions for climate risk assessment and visualization
 */

// Base coordinate interface
export interface Coordinates {
  lat: number;
  lon: number;
}

// Bounding box interface
export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

// Risk severity levels
export type RiskSeverity = 'low' | 'moderate' | 'high' | 'extreme' | 'severe' | 'mild' | 'none';

// Time range options
export type TimeRange = '7d' | '30d' | '90d' | '1y' | '5y';

// Data quality levels
export type DataQuality = 'excellent' | 'good' | 'moderate' | 'poor';

// Trend directions
export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'warming' | 'cooling' | 'improving' | 'declining' | 'wetting' | 'drying';

// Flood Risk Types
export interface FloodRiskData {
  riskScore: number; // 0-1 scale
  riskLevel: RiskSeverity;
  confidence: number; // 0-1 scale
  components: {
    rainfallIntensity: {
      score: number;
      last7Days: number; // mm
      trend: TrendDirection;
      intensity: number; // mm/day
    };
    terrainCharacteristics: {
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
    historicalFrequency: {
      score: number;
      seasonalRisk: number;
      historicalFloods: number;
      longTermTrend: number;
    };
  };
  recommendations: string[];
  timestamp: string;
}

// Drought Risk Types
export interface DroughtRiskData {
  droughtRisk: number; // 0-1 scale
  riskLevel: RiskSeverity;
  confidence: number; // 0-1 scale
  components: {
    precipitationDeficit: {
      score: number;
      deficit: number; // mm
      trend: TrendDirection;
      severity: RiskSeverity;
    };
    temperatureAnomaly: {
      score: number;
      anomaly: number; // °C
      trend: TrendDirection;
      heatStress: number;
    };
    vegetationHealth: {
      score: number;
      ndvi: number;
      health: RiskSeverity;
      trend: TrendDirection;
    };
    soilMoisture: {
      score: number;
      surface: number; // 0-1 scale
      rootZone: number; // 0-1 scale
      trend: TrendDirection;
    };
  };
  recommendations: string[];
  timestamp: string;
}

// Flood Prediction Types
export interface FloodPredictionData {
  predictionScore: number; // 0-1 scale
  severity: RiskSeverity;
  confidence: number; // 0-1 scale
  components: {
    recentRainfall: {
      score: number;
      last7Days: number; // mm
      trend: TrendDirection;
      intensity: number; // mm/day
    };
    historicalPatterns: {
      score: number;
      seasonalRisk: number;
      historicalFloods: number;
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
  };
  predictedFloodRisk: {
    next24h: number;
    next3days: number;
    next7days: number;
  };
  recommendations: string[];
  timestamp: string;
}

// Climate Data Types
export interface ClimateData {
  // Basic climate data
  rainfall: {
    recent: number; // mm last 7 days
    monthly: number; // mm last 30 days
    trend: TrendDirection;
    anomaly: number; // % difference from normal
  };
  temperature: {
    current: number; // °C
    average: number; // °C
    trend: TrendDirection;
    anomaly: number; // °C difference from normal
  };
  elevation: {
    value: number; // meters
    slope: number; // degrees
    drainage: 'good' | 'moderate' | 'poor';
  };
  
  // Satellite data
  ndvi: {
    value: number; // 0-1 scale
    health: RiskSeverity;
    trend: TrendDirection;
  };
  soilMoisture: {
    surface: number; // 0-1 scale
    rootZone: number; // 0-1 scale
    trend: TrendDirection;
  };
  
  // Risk scores
  floodRisk: {
    score: number; // 0-1 scale
    level: RiskSeverity;
    confidence: number; // 0-1 scale
  };
  droughtRisk: {
    score: number; // 0-1 scale
    level: RiskSeverity;
    confidence: number; // 0-1 scale
  };
  floodPrediction: {
    score: number; // 0-1 scale
    level: RiskSeverity;
    next24h: number;
    next3days: number;
    next7days: number;
  };
  
  // Metadata
  lastUpdated: string;
  dataQuality: DataQuality;
}

// Map Layer Types
export interface RiskLayerData {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point' | 'Polygon';
      coordinates: number[] | number[][];
    };
    properties: {
      risk: RiskSeverity;
      score: number;
      [key: string]: any;
    };
  }>;
}

// API Response Types
export interface APIResponse<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// NASA POWER API Types
export interface NASAPowerResponse {
  properties: {
    parameter: {
      T2M?: Record<string, number>; // Temperature
      PRECTOTCORR?: Record<string, number>; // Precipitation
      [key: string]: any;
    };
  };
  geometry: {
    type: string;
    coordinates: number[];
  };
}

// Sentinel Hub API Types
export interface SentinelHubParams {
  bbox: [number, number, number, number]; // [west, south, east, north]
  time: string; // YYYY-MM-DD/YYYY-MM-DD
  width: number;
  height: number;
}

export interface NDVIResponse {
  data: number[][];
  metadata: {
    resolution: string;
    cloudCover: number;
    processingDate: string;
  };
}

// OpenTopography API Types
export interface OpenTopoParams {
  demtype: 'SRTMGL3' | 'SRTMGL1' | 'AW3D30' | 'SRTMGL1_E';
  south: number;
  north: number;
  west: number;
  east: number;
  outputFormat: 'GTiff' | 'AAIGrid' | 'HFA';
  API_Key?: string;
}

export interface ElevationData {
  min: number;
  max: number;
  mean: number;
  std: number;
}

// GFMS API Types
export interface GFMSFloodData {
  timestamp: string;
  location: Coordinates;
  floodDetection: boolean;
  waterDepth: number; // meters
  inundationExtent: number; // square kilometers
  severity: RiskSeverity;
  confidence: number; // 0-1
}

export interface GFMSHistoricalEvent {
  date: string;
  location: Coordinates;
  severity: RiskSeverity;
  waterDepth: number;
  duration: number; // hours
}

export interface GFMSFloodRiskScore {
  currentRisk: number; // 0-1
  historicalFrequency: number; // floods per year
  severity: RiskSeverity;
  lastFloodDate?: string;
}

// Component Props Types
export interface MapLayersProps {
  showFloodRisk: boolean;
  showDroughtRisk: boolean;
  showFloodPrediction: boolean;
  floodRiskData?: RiskLayerData;
  droughtRiskData?: RiskLayerData;
  floodPredictionData?: RiskLayerData;
  isLoadingFloodRisk?: boolean;
  isLoadingDroughtRisk?: boolean;
  isLoadingFloodPrediction?: boolean;
  floodRiskError?: string | null;
  droughtRiskError?: string | null;
  floodPredictionError?: string | null;
  opacity?: number;
  showLabels?: boolean;
}

export interface ClimateRiskPopupProps {
  coordinates: Coordinates;
  onClose: () => void;
  timeRange?: TimeRange;
}

// Hook Return Types
export interface UseRiskDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated?: string;
}

// Utility Types
export type RiskType = 'flood' | 'drought' | 'prediction';

export interface RiskColorScheme {
  [key: string]: string;
}

export interface RiskWeights {
  [key: string]: number;
}

// Configuration Types
export interface AppConfig {
  mapboxToken: string;
  sentinelHub: {
    instanceId: string;
    clientId: string;
    clientSecret: string;
  };
  defaultLocation: Coordinates;
  defaultZoom: number;
  apiEndpoints: {
    nasaPower: string;
    openTopography: string;
  };
}

// Error Types
export interface APIError {
  message: string;
  code?: string;
  status?: number;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Event Types
export interface MapClickEvent {
  coordinates: Coordinates;
  timestamp: string;
  layer?: string;
}

export interface LayerToggleEvent {
  layer: string;
  enabled: boolean;
  timestamp: string;
}

// Export all types
export * from './index';


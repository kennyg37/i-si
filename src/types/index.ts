// Centralized type definitions for the application

// ==================== Geographic Types ====================

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoLocation {
  coordinates: Coordinates;
  name?: string;
  district?: string;
  province?: string;
  elevation?: number;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// ==================== API Response Types ====================

export interface APIError {
  message: string;
  status?: number;
  endpoint?: string;
  timestamp: Date;
}

export interface APIResponse<T> {
  data: T | null;
  error: APIError | null;
  loading: boolean;
}

// NASA POWER API Types
export interface NASAPowerParams {
  lat: number;
  lon: number;
  start: string; // YYYYMMDD format
  end: string;   // YYYYMMDD format
  parameters: string;
}

export interface NASAPowerResponse {
  parameters: any | undefined;
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  properties: {
    parameter: Record<string, {
      [date: string]: number;
    }>;
  };
  metadata?: {
    title: string;
    sources: string[];
  };
}

// CHIRPS API Types
export interface CHIRPSParams {
  lat: number;
  lon: number;
  startDate: string; // YYYY-MM-DD format
  endDate: string;
  operation: 'GetPointTimeSeries' | 'GetPointValue';
}

export interface CHIRPSResponse {
  data: {
    [date: string]: {
      precipitation: number;
      anomaly?: number;
    };
  };
  location: Coordinates;
  timeRange: {
    start: string;
    end: string;
  };
}

// Sentinel Hub API Types
export interface SentinelHubParams {
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  time: string; // YYYY-MM-DD/YYYY-MM-DD format
  width: number;
  height: number;
  format: 'image/png' | 'image/jpeg' | 'application/json';
}

export interface NDVIResponse {
  data: {
    [date: string]: {
      ndvi: number;
      evi: number;
      nir: number;
      red: number;
    };
  };
  bbox: [number, number, number, number];
  time: string;
}

// SRTM Elevation API Types
export interface SRTMParams {
  lat: number;
  lon: number;
  radius?: number;
}

export interface SRTMResponse {
  elevation: number;
  slope: number;
  aspect: number;
  location: Coordinates;
  floodRisk: FloodRiskData;
}

// ==================== Climate Data Types ====================

export type ClimateDataType = 'precipitation' | 'temperature' | 'ndvi' | 'elevation' | 'wind' | 'humidity';

export interface ClimateDataPoint {
  date: string;
  value: number;
  type: ClimateDataType;
  location?: Coordinates;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  dates: string[];
  values: number[];
  type: ClimateDataType;
  location: Coordinates;
  unit: string;
}

export interface AnomalyData {
  value: number;
  anomaly: number;
  percentile: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'extreme';
}

// ==================== Risk Assessment Types ====================

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';

export interface RiskScore {
  value: number; // 0-1 scale
  level: RiskLevel;
  confidence: number; // 0-1 scale
}

export interface DroughtRiskData {
  droughtRisk: number;
  averagePrecipitation: number;
  recentAverage: number;
  riskLevel: RiskLevel;
  location: Coordinates;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface FloodRiskData {
  level: RiskLevel;
  score: number;
  factors: string[];
}

export interface VegetationStressData {
  ndvi: number;
  evi: number;
  stressLevel: RiskLevel;
  healthScore: number;
  location: Coordinates;
  date: string;
}

export interface ClimateRiskAssessment {
  location: Coordinates;
  overallRisk: RiskScore;
  droughtRisk: DroughtRiskData | null;
  floodRisk: FloodRiskData | null;
  vegetationStress: VegetationStressData | null;
  timestamp: Date;
}

// ==================== Map Layer Types ====================

export type LayerType = 'rainfall' | 'temperature' | 'ndvi' | 'flood' | 'drought' | 'elevation';

export interface MapLayer {
  id: LayerType;
  name: string;
  description: string;
  visible: boolean;
  opacity: number;
  color?: string;
}

export interface MapMarker {
  id: string;
  coordinates: Coordinates;
  type: 'selected' | 'risk' | 'station' | 'custom';
  data?: ClimateRiskAssessment;
  label?: string;
}

export interface MapClickEvent {
  coordinates: Coordinates;
  timestamp: Date;
  features?: GeoJSON.Feature[];
}

// ==================== Color Scale Types ====================

export interface ColorScale {
  min: number;
  max: number;
  colors: string[];
  thresholds: number[];
}

export interface LegendItem {
  color: string;
  label: string;
  value: number | string;
}

// ==================== Statistics Types ====================

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  percentiles?: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
}

export interface TrendData {
  slope: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  significance: number;
  r2: number;
}

// ==================== Chart Types ====================

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color: string;
  type?: 'line' | 'bar' | 'area' | 'scatter';
}

// ==================== Time Range Types ====================

export type TimeRangePreset = '7d' | '30d' | '90d' | '6m' | '1y' | '5y' | 'custom';

export interface TimeRange {
  start: string; // ISO date string
  end: string;   // ISO date string
  preset?: TimeRangePreset;
}

// ==================== District/Region Types ====================

export interface District {
  id: string;
  name: string;
  province: string;
  population?: number;
  area?: number; // in km²
  center: Coordinates;
  bounds: BoundingBox;
}

export interface DistrictClimateData {
  district: District;
  climateData: ClimateDataPoint[];
  riskAssessment: ClimateRiskAssessment;
  statistics: StatisticalSummary;
}

// ==================== User Preferences Types ====================

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  units: {
    temperature: 'celsius' | 'fahrenheit';
    precipitation: 'mm' | 'inches';
    distance: 'km' | 'miles';
  };
  mapStyle: 'light' | 'dark' | 'satellite' | 'streets';
  defaultLocation?: Coordinates;
  favoriteLocations: GeoLocation[];
}

// ==================== API Configuration Types ====================

export interface APIConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  baseURL?: string;
}

export interface RateLimiterConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
}

// ==================== Query Hook Types ====================

export interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: boolean | number;
}

// ==================== Store State Types ====================

export interface MapState {
  selectedLocation: GeoLocation | null;
  clickedCoordinates: Coordinates | null;
  viewport: MapViewport;
  markers: MapMarker[];
  activeLayers: LayerType[];
  hoveredFeature: GeoJSON.Feature | null;
}

export interface ClimateDataState {
  currentData: ClimateRiskAssessment | null;
  historicalData: ClimateDataPoint[];
  timeRange: TimeRange;
  loading: boolean;
  error: APIError | null;
}

export interface AppState {
  map: MapState;
  climate: ClimateDataState;
  preferences: UserPreferences;
}

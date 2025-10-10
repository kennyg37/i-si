/**
 * AI Context System Types
 *
 * Type definitions for the AI context system
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Location extends Coordinates {
  name?: string;
}

// Geography Types
export interface City {
  name: string;
  lat: number;
  lon: number;
  population: number;
  province: string;
  elevation: number;
  description: string;
  aliases?: string[];
}

export interface Province {
  name: string;
  coordinates: Coordinates;
  population: number;
  districts: string[];
  climateZone: string;
  elevation: string;
  description: string;
}

export interface Region {
  name: string;
  center: Coordinates;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  elevation: string;
  description: string;
  characteristics: string[];
}

export interface GeographyData {
  country: string;
  defaultCenter: Location;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  provinces: Province[];
  cities: City[];
  regions: Record<string, Region>;
  landmarks: Array<{
    name: string;
    type: string;
    coordinates: Coordinates;
    description: string;
  }>;
  waterways: Array<{
    name: string;
    type: string;
    description: string;
    floodRisk: string;
  }>;
}

// Climate Types
export interface Season {
  name: string;
  months: string[];
  monthNumbers: number[];
  duration: string;
  characteristics: {
    rainfall: string;
    temperature: string;
    humidity: string;
    conditions: string;
  };
  impacts: {
    agriculture: string;
    water: string;
    health: string;
    [key: string]: string;
  };
  risks: string[];
}

export interface ClimateZone {
  zone: string;
  elevation: string;
  location: string[];
  avgTemperature: string;
  avgRainfall: string;
  characteristics: string[];
  vegetation: string[];
  suitableFor: string[];
}

export interface ClimateRisk {
  type: string;
  severity: string;
  season: string;
  peakMonths: number[];
  highRiskAreas: string[];
  causes: string[];
  impacts: string[];
  prevention: string[];
}

export interface ClimateData {
  overview: {
    climateType: string;
    annualRainfall: string;
    avgTemperature: string;
    humidity: string;
    characteristics: string[];
  };
  seasons: Season[];
  climateZones: ClimateZone[];
  commonRisks: ClimateRisk[];
  monthlyPatterns: Record<string, {
    rainfall: string;
    temperature: string;
    risk: string;
  }>;
  historicalEvents: Array<{
    year: number;
    event: string;
    month: string;
    impact: string;
    cause: string;
  }>;
  adaptationStrategies: Array<{
    strategy: string;
    purpose: string;
    regions: string[];
    effectiveness: string;
  }>;
}

// Data Source Types
export interface DataParameter {
  name: string;
  description: string;
  unit: string;
  typical: string;
}

export interface DataSource {
  name: string;
  fullName: string;
  type: string;
  url: string;
  parameters: DataParameter[];
  resolution: string;
  coverage: string;
  updateFrequency: string;
  availability: string;
  dataLatency: string;
  useCases: string[];
}

export interface DataSourcesData {
  dataSources: DataSource[];
  dataIntegration: {
    multiSourceAnalysis: Array<{
      analysis: string;
      sources: string[];
      method: string;
    }>;
  };
  dataQuality: {
    accuracy: Record<string, string>;
    limitations: Record<string, string[]>;
  };
  bestPractices: Array<{
    practice: string;
    reason: string;
    example: string;
  }>;
}

// Context Types
export type PageType = 'map' | 'insights' | 'ai-chat' | 'about' | 'home' | 'notifications';

export interface PageContext {
  page: PageType;
  description?: string;
  activeFeatures?: string[];
}

export interface DataContext {
  insights?: any;
  mapLayers?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  selectedMetrics?: string[];
  visibleData?: any;
}

export interface KnowledgeBase {
  geography: GeographyData;
  climate: ClimateData;
  dataSources: DataSourcesData;
}

export interface AIContext {
  page: PageContext;
  location?: Location;
  data?: DataContext;
  knowledgeBase: KnowledgeBase;
  timestamp: string;
}

// Location Resolution Types
export interface LocationResolutionResult {
  found: boolean;
  location?: Coordinates;
  name?: string;
  type?: 'city' | 'province' | 'region' | 'default';
  confidence: 'high' | 'medium' | 'low';
  alternatives?: string[];
  suggestion?: string;
}

// Context Provider Options
export interface ContextProviderOptions {
  page: PageType;
  location?: Coordinates;
  locationName?: string;
  data?: DataContext;
  includeKnowledgeBase?: boolean;
}

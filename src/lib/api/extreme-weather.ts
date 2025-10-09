/**
 * Extreme Weather Events API
 * Provides tracking and analysis of extreme weather events
 */

export interface ExtremeWeatherEvent {
  id: string;
  type: 'heat_wave' | 'cold_wave' | 'drought' | 'flood' | 'storm' | 'wind' | 'precipitation';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  startDate: string;
  endDate: string;
  duration: number; // days
  intensity: number; // 0-1 scale
  affectedArea: number; // km²
  coordinates: {
    lat: number;
    lon: number;
  };
  description: string;
  impacts: {
    agricultural: number; // 0-1 scale
    infrastructure: number; // 0-1 scale
    health: number; // 0-1 scale
    economic: number; // 0-1 scale
  };
  thresholds: {
    parameter: string;
    value: number;
    unit: string;
    threshold: number;
    exceeded: boolean;
  }[];
}

export interface HeatWaveEvent extends ExtremeWeatherEvent {
  type: 'heat_wave';
  maxTemperature: number;
  minTemperature: number;
  averageTemperature: number;
  consecutiveDays: number;
  heatIndex: number;
}

export interface DroughtEvent extends ExtremeWeatherEvent {
  type: 'drought';
  precipitationDeficit: number; // mm
  soilMoistureDeficit: number; // 0-1 scale
  streamflowDeficit: number; // % of normal
  vegetationStress: number; // 0-1 scale
}

export interface FloodEvent extends ExtremeWeatherEvent {
  type: 'flood';
  precipitationTotal: number; // mm
  peakIntensity: number; // mm/hour
  duration: number; // hours
  returnPeriod: number; // years
  waterLevel: number; // meters above normal
}

export interface StormEvent extends ExtremeWeatherEvent {
  type: 'storm';
  maxWindSpeed: number; // m/s
  averageWindSpeed: number; // m/s
  precipitationTotal: number; // mm
  pressure: number; // hPa
  category: string;
}

export interface ExtremeWeatherResponse {
  coordinates: {
    lat: number;
    lon: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
  events: ExtremeWeatherEvent[];
  summary: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    averageDuration: number;
    totalImpact: number;
  };
  alerts: WeatherAlert[];
  metadata: {
    dataSource: string;
    lastUpdated: string;
    confidence: number;
  };
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory' | 'outlook';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  event: string;
  description: string;
  issuedAt: string;
  expiresAt: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  affectedArea: number; // km²
  recommendations: string[];
}

/**
 * Detect heat wave events
 */
export function detectHeatWave(
  temperatures: { date: string; value: number }[],
  threshold: number = 35, // °C
  minDuration: number = 3 // days
): HeatWaveEvent[] {
  const events: HeatWaveEvent[] = [];
  let currentEvent: Partial<HeatWaveEvent> | null = null;

  for (let i = 0; i < temperatures.length; i++) {
    const temp = temperatures[i];
    
    if (temp.value >= threshold) {
      if (!currentEvent) {
        currentEvent = {
          id: `heat_wave_${temp.date}`,
          type: 'heat_wave',
          startDate: temp.date,
          maxTemperature: temp.value,
          minTemperature: temp.value,
          averageTemperature: temp.value,
          consecutiveDays: 1,
          heatIndex: temp.value + 5, // Simplified
          intensity: 0,
          affectedArea: 100,
          coordinates: { lat: 0, lon: 0 }, // Would be provided
          description: '',
          impacts: { agricultural: 0, infrastructure: 0, health: 0, economic: 0 },
          thresholds: []
        };
      } else {
        currentEvent.maxTemperature = Math.max(currentEvent.maxTemperature || 0, temp.value);
        currentEvent.minTemperature = Math.min(currentEvent.minTemperature || 100, temp.value);
        currentEvent.consecutiveDays = (currentEvent.consecutiveDays || 0) + 1;
        currentEvent.averageTemperature = ((currentEvent.averageTemperature || 0) * (currentEvent.consecutiveDays - 1) + temp.value) / currentEvent.consecutiveDays;
      }
    } else {
      if (currentEvent && currentEvent.consecutiveDays >= minDuration) {
        currentEvent.endDate = temperatures[i - 1].date;
        currentEvent.duration = currentEvent.consecutiveDays;
        currentEvent.intensity = Math.min(1, (currentEvent.averageTemperature - threshold) / 10);
        currentEvent.severity = getSeverity(currentEvent.intensity);
        currentEvent.description = `Heat wave lasting ${currentEvent.duration} days with average temperature ${currentEvent.averageTemperature.toFixed(1)}°C`;
        
        events.push(currentEvent as HeatWaveEvent);
      }
      currentEvent = null;
    }
  }

  return events;
}

/**
 * Detect drought events
 */
export function detectDrought(
  precipitation: { date: string; value: number }[],
  soilMoisture: { date: string; value: number }[],
  threshold: number = 0.3 // 30% of normal
): DroughtEvent[] {
  const events: DroughtEvent[] = [];
  let currentEvent: Partial<DroughtEvent> | null = null;

  for (let i = 0; i < precipitation.length; i++) {
    const precip = precipitation[i];
    const soil = soilMoisture[i];
    
    if (precip.value < threshold) {
      if (!currentEvent) {
        currentEvent = {
          id: `drought_${precip.date}`,
          type: 'drought',
          startDate: precip.date,
          precipitationDeficit: threshold - precip.value,
          soilMoistureDeficit: 1 - soil.value,
          streamflowDeficit: 0,
          vegetationStress: 1 - soil.value,
          intensity: 0,
          affectedArea: 100,
          coordinates: { lat: 0, lon: 0 },
          description: '',
          impacts: { agricultural: 0, infrastructure: 0, health: 0, economic: 0 },
          thresholds: []
        };
      } else {
        currentEvent.precipitationDeficit += threshold - precip.value;
        currentEvent.soilMoistureDeficit = Math.max(currentEvent.soilMoistureDeficit || 0, 1 - soil.value);
        currentEvent.vegetationStress = Math.max(currentEvent.vegetationStress || 0, 1 - soil.value);
      }
    } else {
      if (currentEvent && currentEvent.precipitationDeficit > 10) { // 10mm deficit threshold
        currentEvent.endDate = precipitation[i - 1].date;
        currentEvent.duration = Math.ceil(currentEvent.precipitationDeficit / 5); // Rough estimate
        currentEvent.intensity = Math.min(1, currentEvent.precipitationDeficit / 50);
        currentEvent.severity = getSeverity(currentEvent.intensity);
        currentEvent.description = `Drought with ${currentEvent.precipitationDeficit.toFixed(1)}mm precipitation deficit`;
        
        events.push(currentEvent as DroughtEvent);
      }
      currentEvent = null;
    }
  }

  return events;
}

/**
 * Detect flood events
 */
export function detectFlood(
  precipitation: { date: string; value: number }[],
  intensityThreshold: number = 20, // mm/hour
  totalThreshold: number = 50 // mm/day
): FloodEvent[] {
  const events: FloodEvent[] = [];
  let currentEvent: Partial<FloodEvent> | null = null;

  for (let i = 0; i < precipitation.length; i++) {
    const precip = precipitation[i];
    
    if (precip.value >= totalThreshold) {
      if (!currentEvent) {
        currentEvent = {
          id: `flood_${precip.date}`,
          type: 'flood',
          startDate: precip.date,
          precipitationTotal: precip.value,
          peakIntensity: precip.value,
          duration: 1,
          returnPeriod: 0,
          waterLevel: 0,
          intensity: 0,
          affectedArea: 100,
          coordinates: { lat: 0, lon: 0 },
          description: '',
          impacts: { agricultural: 0, infrastructure: 0, health: 0, economic: 0 },
          thresholds: []
        };
      } else {
        currentEvent.precipitationTotal += precip.value;
        currentEvent.peakIntensity = Math.max(currentEvent.peakIntensity || 0, precip.value);
        currentEvent.duration = (currentEvent.duration || 0) + 1;
      }
    } else {
      if (currentEvent && currentEvent.precipitationTotal > 100) { // 100mm total threshold
        currentEvent.endDate = precipitation[i - 1].date;
        currentEvent.intensity = Math.min(1, currentEvent.precipitationTotal / 200);
        currentEvent.severity = getSeverity(currentEvent.intensity);
        currentEvent.returnPeriod = calculateReturnPeriod(currentEvent.precipitationTotal);
        currentEvent.description = `Flood event with ${currentEvent.precipitationTotal.toFixed(1)}mm total precipitation`;
        
        events.push(currentEvent as FloodEvent);
      }
      currentEvent = null;
    }
  }

  return events;
}

/**
 * Generate weather alerts based on current conditions
 */
export function generateWeatherAlerts(
  currentConditions: any,
  forecasts: any[]
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // Heat wave alert
  if (currentConditions.temperature > 35) {
    alerts.push({
      id: `heat_alert_${Date.now()}`,
      type: 'warning',
      severity: 'high',
      event: 'Heat Wave',
      description: `Extreme heat conditions with temperature reaching ${currentConditions.temperature}°C`,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      coordinates: currentConditions.coordinates,
      affectedArea: 100,
      recommendations: [
        'Stay hydrated and avoid prolonged outdoor activities',
        'Check on elderly and vulnerable populations',
        'Use air conditioning or fans to stay cool'
      ]
    });
  }

  // Drought alert
  if (currentConditions.soilMoisture < 0.3) {
    alerts.push({
      id: `drought_alert_${Date.now()}`,
      type: 'advisory',
      severity: 'moderate',
      event: 'Drought Conditions',
      description: `Low soil moisture levels detected (${(currentConditions.soilMoisture * 100).toFixed(1)}%)`,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      coordinates: currentConditions.coordinates,
      affectedArea: 100,
      recommendations: [
        'Implement water conservation measures',
        'Monitor crop conditions closely',
        'Consider irrigation if available'
      ]
    });
  }

  // Flood alert
  if (currentConditions.precipitation > 50) {
    alerts.push({
      id: `flood_alert_${Date.now()}`,
      type: 'warning',
      severity: 'high',
      event: 'Flood Risk',
      description: `Heavy precipitation detected (${currentConditions.precipitation}mm)`,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      coordinates: currentConditions.coordinates,
      affectedArea: 100,
      recommendations: [
        'Avoid low-lying areas and water crossings',
        'Monitor water levels in nearby streams',
        'Prepare for potential flooding'
      ]
    });
  }

  return alerts;
}

/**
 * Helper functions
 */
function getSeverity(intensity: number): 'low' | 'moderate' | 'high' | 'extreme' {
  if (intensity >= 0.8) return 'extreme';
  if (intensity >= 0.6) return 'high';
  if (intensity >= 0.4) return 'moderate';
  return 'low';
}

function calculateReturnPeriod(precipitation: number): number {
  // Simplified return period calculation
  if (precipitation >= 200) return 100;
  if (precipitation >= 150) return 50;
  if (precipitation >= 100) return 25;
  if (precipitation >= 75) return 10;
  if (precipitation >= 50) return 5;
  return 2;
}

/**
 * Fetch extreme weather events
 */
export async function fetchExtremeWeatherEvents(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<ExtremeWeatherResponse> {
  try {
    // This would integrate with weather APIs and historical data
    // For now, returning mock data structure
    const mockData: ExtremeWeatherResponse = {
      coordinates: { lat, lon },
      timeRange: { start: startDate, end: endDate },
      events: generateMockExtremeWeatherEvents(startDate, endDate),
      summary: {
        totalEvents: 5,
        eventsByType: {
          heat_wave: 2,
          drought: 1,
          flood: 1,
          storm: 1
        },
        eventsBySeverity: {
          low: 1,
          moderate: 2,
          high: 2,
          extreme: 0
        },
        averageDuration: 7.2,
        totalImpact: 0.6
      },
      alerts: generateMockWeatherAlerts(),
      metadata: {
        dataSource: 'Weather API',
        lastUpdated: new Date().toISOString(),
        confidence: 0.85
      }
    };

    return mockData;
  } catch (error) {
    console.error('Error fetching extreme weather events:', error);
    throw new Error('Failed to fetch extreme weather events');
  }
}

// Mock data generators
function generateMockExtremeWeatherEvents(startDate: string, endDate: string): ExtremeWeatherEvent[] {
  return [
    {
      id: 'heat_wave_1',
      type: 'heat_wave',
      severity: 'high',
      startDate: '2024-01-15',
      endDate: '2024-01-18',
      duration: 4,
      intensity: 0.7,
      affectedArea: 500,
      coordinates: { lat: -1.9403, lon: 29.8739 },
      description: 'Heat wave with temperatures exceeding 35°C for 4 consecutive days',
      impacts: { agricultural: 0.6, infrastructure: 0.3, health: 0.8, economic: 0.4 },
      thresholds: [
        { parameter: 'Temperature', value: 36.5, unit: '°C', threshold: 35, exceeded: true }
      ],
      maxTemperature: 36.5,
      minTemperature: 35.2,
      averageTemperature: 35.8,
      consecutiveDays: 4,
      heatIndex: 38.2
    } as HeatWaveEvent,
    {
      id: 'drought_1',
      type: 'drought',
      severity: 'moderate',
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      duration: 28,
      intensity: 0.5,
      affectedArea: 1000,
      coordinates: { lat: -1.9403, lon: 29.8739 },
      description: 'Extended dry period with below-normal precipitation',
      impacts: { agricultural: 0.7, infrastructure: 0.2, health: 0.3, economic: 0.5 },
      thresholds: [
        { parameter: 'Precipitation', value: 15, unit: 'mm', threshold: 50, exceeded: false }
      ],
      precipitationDeficit: 35,
      soilMoistureDeficit: 0.4,
      streamflowDeficit: 25,
      vegetationStress: 0.6
    } as DroughtEvent
  ];
}

function generateMockWeatherAlerts(): WeatherAlert[] {
  return [
    {
      id: 'alert_1',
      type: 'warning',
      severity: 'high',
      event: 'Heat Wave',
      description: 'Extreme heat conditions expected',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      coordinates: { lat: -1.9403, lon: 29.8739 },
      affectedArea: 500,
      recommendations: [
        'Stay hydrated',
        'Avoid outdoor activities during peak hours',
        'Check on vulnerable populations'
      ]
    }
  ];
}

/**
 * Extreme Weather Events API
 * Provides tracking and analysis of extreme weather events
 */

export interface ExtremeWeatherEvent {
  precipitationDeficit?: number;
  precipitationTotal?: number;
  peakIntensity?: number;
  returnPeriod?: number;
  maxWindSpeed?: number;
  averageWindSpeed?: number;
  category?: string;
  averageTemperature?: number;
  maxTemperature?: number;
  heatIndex?: number;
  soilMoistureDeficit?: number;
  vegetationStress?: number;
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
      if (
        currentEvent &&
        typeof currentEvent.consecutiveDays === 'number' &&
        currentEvent.consecutiveDays >= minDuration &&
        typeof currentEvent.averageTemperature === 'number'
      ) {
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
      } else if (currentEvent) {
        currentEvent.precipitationDeficit = (currentEvent.precipitationDeficit || 0) + (threshold - precip.value);
        currentEvent.soilMoistureDeficit = Math.max(currentEvent.soilMoistureDeficit ?? 0, 1 - soil.value);
        currentEvent.vegetationStress = Math.max(currentEvent.vegetationStress ?? 0, 1 - soil.value);
      }
    } else {
      if (currentEvent && (currentEvent.precipitationDeficit || 0) > 10) { // 10mm deficit threshold
        currentEvent.endDate = precipitation[i - 1].date;
        currentEvent.duration = Math.ceil((currentEvent.precipitationDeficit || 0) / 5); // Rough estimate
        currentEvent.intensity = Math.min(1, (currentEvent.precipitationDeficit || 0) / 50);
        currentEvent.severity = getSeverity(currentEvent.intensity);
        currentEvent.description = `Drought with ${(currentEvent.precipitationDeficit || 0).toFixed(1)}mm precipitation deficit`;
        
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
        currentEvent.precipitationTotal = (currentEvent.precipitationTotal || 0) + precip.value;
        currentEvent.peakIntensity = Math.max(currentEvent.peakIntensity || 0, precip.value);
        currentEvent.duration = (currentEvent.duration || 0) + 1;
      }
    } else {
      if (currentEvent && (currentEvent.precipitationTotal || 0) > 100) { // 100mm total threshold
        currentEvent.endDate = precipitation[i - 1].date;
        currentEvent.intensity = Math.min(1, (currentEvent.precipitationTotal || 0) / 200);
        currentEvent.severity = getSeverity(currentEvent.intensity);
        currentEvent.returnPeriod = calculateReturnPeriod(currentEvent.precipitationTotal || 0);
        currentEvent.description = `Flood event with ${(currentEvent.precipitationTotal || 0).toFixed(1)}mm total precipitation`;
        
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
  currentConditions: any
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
 * Fetch extreme weather events using REAL data from Open-Meteo
 */
export async function fetchExtremeWeatherEvents(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<ExtremeWeatherResponse> {
  try {
    console.log('[Extreme Weather] Fetching REAL events from Open-Meteo...');

    // Import Open-Meteo integration
    const { detectExtremeWeatherEvents, getCurrentWeather } = await import('./open-meteo');

    // Fetch real extreme weather events from Open-Meteo
    const detectedEvents = await detectExtremeWeatherEvents(lat, lon, startDate, endDate);

    // Combine all event types
    const allEvents: ExtremeWeatherEvent[] = [
      ...detectedEvents.heatWaves,
      ...detectedEvents.coldSpells,
      ...detectedEvents.droughts,
      ...detectedEvents.floods,
      ...detectedEvents.heavyRain,
    ];

    // Calculate summary statistics from REAL events
    const totalEvents = allEvents.length;

    const eventsByType: Record<string, number> = {};
    allEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    const eventsBySeverity: Record<string, number> = {};
    allEvents.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    const averageDuration = totalEvents > 0
      ? allEvents.reduce((sum, event) => sum + event.duration, 0) / totalEvents
      : 0;

    const totalImpact = totalEvents > 0
      ? allEvents.reduce((sum, event) => sum + (event.intensity || 0), 0) / totalEvents
      : 0;

    // Generate real-time weather alerts based on current conditions
    const currentWeather = await getCurrentWeather(lat, lon);
    const alerts = generateWeatherAlerts(currentWeather);

    const response: ExtremeWeatherResponse = {
      coordinates: { lat, lon },
      timeRange: { start: startDate, end: endDate },
      events: allEvents,
      summary: {
        totalEvents,
        eventsByType,
        eventsBySeverity,
        averageDuration,
        totalImpact,
      },
      alerts,
      metadata: {
        dataSource: 'Open-Meteo (Real Data)',
        lastUpdated: new Date().toISOString(),
        confidence: 0.90, // Higher confidence with real data
      },
    };

    console.log(`[Extreme Weather] Found ${totalEvents} REAL events:`, eventsByType);
    return response;
  } catch (error) {
    console.error('[Extreme Weather] Error fetching real events:', error);

    // Fallback to minimal response on error
    return {
      coordinates: { lat, lon },
      timeRange: { start: startDate, end: endDate },
      events: [],
      summary: {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        averageDuration: 0,
        totalImpact: 0,
      },
      alerts: [],
      metadata: {
        dataSource: 'Open-Meteo (Error - No Data)',
        lastUpdated: new Date().toISOString(),
        confidence: 0,
      },
    };
  }
}

// ✅ NO MORE MOCK DATA!
// All events are now detected from REAL Open-Meteo historical data

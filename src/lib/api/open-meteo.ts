/**
 * Open-Meteo API Client
 *
 * FREE unlimited weather API - no API key required!
 *
 * Features:
 * - Historical weather data (1940-present)
 * - 16-day forecast
 * - Hourly & daily resolution
 * - Global coverage (11km resolution)
 * - 50+ weather parameters
 *
 * Documentation: https://open-meteo.com/en/docs
 * Archive API: https://open-meteo.com/en/docs/historical-weather-api
 */

import axios from 'axios';

const HISTORICAL_API_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const FORECAST_API_BASE = 'https://api.open-meteo.com/v1/forecast';

export interface OpenMeteoHistoricalParams {
  latitude: number;
  longitude: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  hourly?: string[]; // e.g., ['temperature_2m', 'precipitation']
  daily?: string[]; // e.g., ['temperature_2m_max', 'precipitation_sum']
  timezone?: string; // e.g., 'Africa/Kigali'
}

export interface OpenMeteoForecastParams {
  latitude: number;
  longitude: number;
  hourly?: string[];
  daily?: string[];
  timezone?: string;
}

export interface OpenMeteoHourlyData {
  time: string[];
  temperature_2m?: number[];
  relative_humidity_2m?: number[];
  precipitation?: number[];
  rain?: number[];
  snowfall?: number[];
  soil_moisture_0_to_10cm?: number[];
  soil_moisture_10_to_40cm?: number[];
  soil_temperature_0_to_10cm?: number[];
  wind_speed_10m?: number[];
  wind_direction_10m?: number[];
  surface_pressure?: number[];
  cloud_cover?: number[];
}

export interface OpenMeteoDailyData {
  time: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  temperature_2m_mean?: number[];
  precipitation_sum?: number[];
  rain_sum?: number[];
  precipitation_hours?: number[];
  wind_speed_10m_max?: number[];
  et0_fao_evapotranspiration?: number[]; // Reference evapotranspiration
}

export interface OpenMeteoHistoricalResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  hourly?: OpenMeteoHourlyData;
  daily?: OpenMeteoDailyData;
  hourly_units?: Record<string, string>;
  daily_units?: Record<string, string>;
}

export interface OpenMeteoForecastResponse extends OpenMeteoHistoricalResponse {
  current_weather?: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
}

/**
 * Fetch historical weather data
 */
export async function fetchHistoricalWeather(
  params: OpenMeteoHistoricalParams
): Promise<OpenMeteoHistoricalResponse> {
  try {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      start_date: params.start_date,
      end_date: params.end_date,
      timezone: params.timezone || 'Africa/Kigali',
    });

    if (params.hourly && params.hourly.length > 0) {
      queryParams.append('hourly', params.hourly.join(','));
    }

    if (params.daily && params.daily.length > 0) {
      queryParams.append('daily', params.daily.join(','));
    }

    const url = `${HISTORICAL_API_BASE}?${queryParams.toString()}`;
    console.log('[Open-Meteo] Fetching historical data:', url);

    const response = await axios.get<OpenMeteoHistoricalResponse>(url, {
      timeout: 30000, // 30 second timeout
    });

    console.log('[Open-Meteo] Historical data received successfully');
    return response.data;
  } catch (error) {
    console.error('[Open-Meteo] Error fetching historical data:', error);
    throw new Error('Failed to fetch historical weather data from Open-Meteo');
  }
}

/**
 * Fetch weather forecast (next 16 days)
 */
export async function fetchWeatherForecast(
  params: OpenMeteoForecastParams
): Promise<OpenMeteoForecastResponse> {
  try {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      timezone: params.timezone || 'Africa/Kigali',
      current_weather: 'true',
    });

    if (params.hourly && params.hourly.length > 0) {
      queryParams.append('hourly', params.hourly.join(','));
    }

    if (params.daily && params.daily.length > 0) {
      queryParams.append('daily', params.daily.join(','));
    }

    const url = `${FORECAST_API_BASE}?${queryParams.toString()}`;
    console.log('[Open-Meteo] Fetching forecast:', url);

    const response = await axios.get<OpenMeteoForecastResponse>(url, {
      timeout: 30000,
    });

    console.log('[Open-Meteo] Forecast data received successfully');
    return response.data;
  } catch (error) {
    console.error('[Open-Meteo] Error fetching forecast:', error);
    throw new Error('Failed to fetch weather forecast from Open-Meteo');
  }
}

/**
 * Get extreme weather events from historical data
 * This replaces mock data with REAL detection from actual measurements
 */
export async function detectExtremeWeatherEvents(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
) {
  try {
    console.log('[Open-Meteo] Detecting extreme weather events from real data...');

    // Fetch comprehensive historical data
    const data = await fetchHistoricalWeather({
      latitude: lat,
      longitude: lon,
      start_date: startDate,
      end_date: endDate,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'precipitation_sum',
        'precipitation_hours',
        'wind_speed_10m_max',
        'et0_fao_evapotranspiration',
      ],
      hourly: [
        'temperature_2m',
        'precipitation',
        'soil_moisture_0_to_10cm',
      ],
    });

    // Process data to detect events
    const events = {
      heatWaves: detectHeatWavesFromData(data),
      coldSpells: detectColdSpellsFromData(data),
      droughts: detectDroughtsFromData(data),
      floods: detectFloodsFromData(data),
      heavyRain: detectHeavyRainFromData(data),
    };

    console.log('[Open-Meteo] Extreme events detected:', {
      heatWaves: events.heatWaves.length,
      coldSpells: events.coldSpells.length,
      droughts: events.droughts.length,
      floods: events.floods.length,
      heavyRain: events.heavyRain.length,
    });

    return events;
  } catch (error) {
    console.error('[Open-Meteo] Error detecting extreme events:', error);
    throw error;
  }
}

/**
 * Detect heat waves from real temperature data
 * Definition: 3+ consecutive days with max temp > 35°C (Rwanda threshold)
 */
function detectHeatWavesFromData(data: OpenMeteoHistoricalResponse) {
  if (!data.daily?.temperature_2m_max || !data.daily?.time) {
    return [];
  }

  const events: any[] = [];
  const temps = data.daily.temperature_2m_max;
  const dates = data.daily.time;
  const threshold = 30; // Rwanda heat wave threshold (adjusted for climate)

  let currentEvent: any = null;

  for (let i = 0; i < temps.length; i++) {
    const temp = temps[i];
    const date = dates[i];

    if (temp >= threshold) {
      if (!currentEvent) {
        currentEvent = {
          startDate: date,
          maxTemp: temp,
          minTemp: temp,
          totalTemp: temp,
          days: 1,
          dates: [date],
          temps: [temp],
        };
      } else {
        currentEvent.days++;
        currentEvent.maxTemp = Math.max(currentEvent.maxTemp, temp);
        currentEvent.minTemp = Math.min(currentEvent.minTemp, temp);
        currentEvent.totalTemp += temp;
        currentEvent.dates.push(date);
        currentEvent.temps.push(temp);
      }
    } else {
      if (currentEvent && currentEvent.days >= 3) {
        // Valid heat wave (3+ days)
        events.push({
          id: `heat_wave_${currentEvent.startDate}`,
          type: 'heat_wave',
          severity: getSeverity(currentEvent.maxTemp, threshold, 5),
          startDate: currentEvent.startDate,
          endDate: currentEvent.dates[currentEvent.dates.length - 1],
          duration: currentEvent.days,
          intensity: Math.min(1, (currentEvent.maxTemp - threshold) / 10),
          maxTemperature: currentEvent.maxTemp,
          minTemperature: currentEvent.minTemp,
          averageTemperature: currentEvent.totalTemp / currentEvent.days,
          consecutiveDays: currentEvent.days,
          heatIndex: currentEvent.maxTemp + 3, // Simplified heat index
          description: `Heat wave lasting ${currentEvent.days} days with peak temperature ${currentEvent.maxTemp.toFixed(1)}°C`,
        });
      }
      currentEvent = null;
    }
  }

  // Check for ongoing event
  if (currentEvent && currentEvent.days >= 3) {
    events.push({
      id: `heat_wave_${currentEvent.startDate}`,
      type: 'heat_wave',
      severity: getSeverity(currentEvent.maxTemp, threshold, 5),
      startDate: currentEvent.startDate,
      endDate: currentEvent.dates[currentEvent.dates.length - 1],
      duration: currentEvent.days,
      intensity: Math.min(1, (currentEvent.maxTemp - threshold) / 10),
      maxTemperature: currentEvent.maxTemp,
      minTemperature: currentEvent.minTemp,
      averageTemperature: currentEvent.totalTemp / currentEvent.days,
      consecutiveDays: currentEvent.days,
      heatIndex: currentEvent.maxTemp + 3,
      description: `Heat wave lasting ${currentEvent.days} days with peak temperature ${currentEvent.maxTemp.toFixed(1)}°C`,
    });
  }

  return events;
}

/**
 * Detect cold spells (relevant for Rwanda highlands)
 * Definition: 3+ consecutive days with min temp < 10°C
 */
function detectColdSpellsFromData(data: OpenMeteoHistoricalResponse) {
  if (!data.daily?.temperature_2m_min || !data.daily?.time) {
    return [];
  }

  const events: any[] = [];
  const temps = data.daily.temperature_2m_min;
  const dates = data.daily.time;
  const threshold = 10; // Rwanda cold spell threshold

  let currentEvent: any = null;

  for (let i = 0; i < temps.length; i++) {
    const temp = temps[i];
    const date = dates[i];

    if (temp <= threshold) {
      if (!currentEvent) {
        currentEvent = {
          startDate: date,
          minTemp: temp,
          maxTemp: temp,
          totalTemp: temp,
          days: 1,
          dates: [date],
          temps: [temp],
        };
      } else {
        currentEvent.days++;
        currentEvent.minTemp = Math.min(currentEvent.minTemp, temp);
        currentEvent.maxTemp = Math.max(currentEvent.maxTemp, temp);
        currentEvent.totalTemp += temp;
        currentEvent.dates.push(date);
        currentEvent.temps.push(temp);
      }
    } else {
      if (currentEvent && currentEvent.days >= 3) {
        events.push({
          id: `cold_wave_${currentEvent.startDate}`,
          type: 'cold_wave',
          severity: getSeverity(threshold, currentEvent.minTemp, 5),
          startDate: currentEvent.startDate,
          endDate: currentEvent.dates[currentEvent.dates.length - 1],
          duration: currentEvent.days,
          intensity: Math.min(1, (threshold - currentEvent.minTemp) / 10),
          minTemperature: currentEvent.minTemp,
          maxTemperature: currentEvent.maxTemp,
          averageTemperature: currentEvent.totalTemp / currentEvent.days,
          consecutiveDays: currentEvent.days,
          description: `Cold spell lasting ${currentEvent.days} days with minimum temperature ${currentEvent.minTemp.toFixed(1)}°C`,
        });
      }
      currentEvent = null;
    }
  }

  return events;
}

/**
 * Detect droughts from precipitation data
 * Definition: 30+ days with cumulative rainfall < 30mm (severe deficit)
 */
function detectDroughtsFromData(data: OpenMeteoHistoricalResponse) {
  if (!data.daily?.precipitation_sum || !data.daily?.time) {
    return [];
  }

  const events: any[] = [];
  const precip = data.daily.precipitation_sum;
  const dates = data.daily.time;
  const et0 = data.daily?.et0_fao_evapotranspiration || [];

  // 30-day rolling window
  const windowSize = 30;
  const threshold = 30; // mm per 30 days (severe drought)

  for (let i = windowSize; i < precip.length; i++) {
    const windowPrecip = precip.slice(i - windowSize, i);
    const totalPrecip = windowPrecip.reduce((sum, val) => sum + (val || 0), 0);

    const windowET0 = et0.slice(i - windowSize, i);
    const totalET0 = windowET0.reduce((sum, val) => sum + (val || 0), 0);

    const deficit = totalET0 - totalPrecip; // Water deficit

    if (totalPrecip < threshold || deficit > 50) {
      // Severe drought conditions
      const soilMoistureDeficit = Math.min(1, deficit / 100);

      events.push({
        id: `drought_${dates[i - windowSize]}`,
        type: 'drought',
        severity: getSeverity(threshold, totalPrecip, 20),
        startDate: dates[i - windowSize],
        endDate: dates[i],
        duration: windowSize,
        intensity: Math.min(1, (threshold - totalPrecip) / threshold),
        precipitationDeficit: threshold - totalPrecip,
        soilMoistureDeficit: soilMoistureDeficit,
        streamflowDeficit: Math.min(100, (deficit / totalET0) * 100),
        vegetationStress: soilMoistureDeficit,
        description: `Drought period with only ${totalPrecip.toFixed(1)}mm rainfall over ${windowSize} days (deficit: ${deficit.toFixed(1)}mm)`,
      });
    }
  }

  // Remove overlapping events (keep most severe)
  return deduplicateEvents(events);
}

/**
 * Detect flood events from heavy precipitation
 * Definition: Daily rainfall > 50mm (flash flood threshold for Rwanda)
 */
function detectFloodsFromData(data: OpenMeteoHistoricalResponse) {
  if (!data.daily?.precipitation_sum || !data.daily?.time) {
    return [];
  }

  const events: any[] = [];
  const precip = data.daily.precipitation_sum;
  const dates = data.daily.time;
  const threshold = 50; // mm/day (Rwanda flash flood threshold)

  let currentEvent: any = null;

  for (let i = 0; i < precip.length; i++) {
    const rain = precip[i] || 0;
    const date = dates[i];

    if (rain >= threshold) {
      if (!currentEvent) {
        currentEvent = {
          startDate: date,
          peakIntensity: rain,
          totalPrecip: rain,
          days: 1,
          dates: [date],
          rains: [rain],
        };
      } else {
        currentEvent.days++;
        currentEvent.peakIntensity = Math.max(currentEvent.peakIntensity, rain);
        currentEvent.totalPrecip += rain;
        currentEvent.dates.push(date);
        currentEvent.rains.push(rain);
      }
    } else {
      if (currentEvent && currentEvent.totalPrecip >= threshold) {
        events.push({
          id: `flood_${currentEvent.startDate}`,
          type: 'flood',
          severity: getSeverity(currentEvent.peakIntensity, threshold, 50),
          startDate: currentEvent.startDate,
          endDate: currentEvent.dates[currentEvent.dates.length - 1],
          duration: currentEvent.days,
          intensity: Math.min(1, currentEvent.peakIntensity / 150),
          precipitationTotal: currentEvent.totalPrecip,
          peakIntensity: currentEvent.peakIntensity / 24, // Convert to mm/hr estimate
          returnPeriod: calculateReturnPeriod(currentEvent.peakIntensity),
          waterLevel: estimateWaterLevel(currentEvent.peakIntensity),
          description: `Heavy rainfall event with ${currentEvent.totalPrecip.toFixed(1)}mm over ${currentEvent.days} day(s), peak: ${currentEvent.peakIntensity.toFixed(1)}mm`,
        });
      }
      currentEvent = null;
    }
  }

  return events;
}

/**
 * Detect heavy rain events (not floods, but significant precipitation)
 */
function detectHeavyRainFromData(data: OpenMeteoHistoricalResponse) {
  if (!data.daily?.precipitation_sum || !data.daily?.time) {
    return [];
  }

  const events: any[] = [];
  const precip = data.daily.precipitation_sum;
  const dates = data.daily.time;
  const threshold = 25; // mm/day (heavy rain threshold)

  for (let i = 0; i < precip.length; i++) {
    const rain = precip[i] || 0;

    if (rain >= threshold && rain < 50) {
      // Heavy rain but not flood level
      events.push({
        id: `heavy_rain_${dates[i]}`,
        type: 'precipitation',
        severity: getSeverity(rain, threshold, 25),
        startDate: dates[i],
        endDate: dates[i],
        duration: 1,
        intensity: Math.min(1, rain / 75),
        precipitationTotal: rain,
        description: `Heavy rainfall of ${rain.toFixed(1)}mm`,
      });
    }
  }

  return events;
}

/**
 * Helper functions
 */
function getSeverity(value: number, threshold: number, range: number): string {
  const normalized = (value - threshold) / range;
  if (normalized >= 1.5) return 'extreme';
  if (normalized >= 1.0) return 'high';
  if (normalized >= 0.5) return 'moderate';
  return 'low';
}

function calculateReturnPeriod(precipitation: number): number {
  // Simplified return period based on daily precipitation
  if (precipitation >= 200) return 100;
  if (precipitation >= 150) return 50;
  if (precipitation >= 100) return 25;
  if (precipitation >= 75) return 10;
  if (precipitation >= 50) return 5;
  return 2;
}

function estimateWaterLevel(precipitation: number): number {
  // Simplified water level estimate (meters above normal)
  return Math.min(5, precipitation / 50);
}

function deduplicateEvents(events: any[]): any[] {
  // Remove overlapping drought events, keep most severe
  const uniqueEvents: any[] = [];

  for (const event of events) {
    const overlap = uniqueEvents.find((e) => {
      const eStart = new Date(e.startDate).getTime();
      const eEnd = new Date(e.endDate).getTime();
      const eventStart = new Date(event.startDate).getTime();
      const eventEnd = new Date(event.endDate).getTime();

      return (eventStart <= eEnd && eventEnd >= eStart);
    });

    if (!overlap) {
      uniqueEvents.push(event);
    } else if (event.intensity > overlap.intensity) {
      // Replace with more severe event
      const index = uniqueEvents.indexOf(overlap);
      uniqueEvents[index] = event;
    }
  }

  return uniqueEvents;
}

/**
 * Get current weather conditions
 */
export async function getCurrentWeather(lat: number, lon: number) {
  try {
    const data = await fetchWeatherForecast({
      latitude: lat,
      longitude: lon,
      hourly: ['temperature_2m', 'precipitation', 'relative_humidity_2m', 'soil_moisture_0_to_10cm'],
    });

    return {
      temperature: data.current_weather?.temperature || 0,
      precipitation: data.hourly?.precipitation?.[0] || 0,
      humidity: data.hourly?.relative_humidity_2m?.[0] || 0,
      soilMoisture: data.hourly?.soil_moisture_0_to_10cm?.[0] || 0,
      coordinates: { lat, lon },
    };
  } catch (error) {
    console.error('[Open-Meteo] Error fetching current weather:', error);
    throw error;
  }
}

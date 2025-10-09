/**
 * Climate Indices API
 * Provides calculations for various climate indices used in drought monitoring and climate analysis
 */

export interface ClimateIndexData {
  date: string;
  value: number;
  category: string;
  description: string;
}

export interface SPIData extends ClimateIndexData {
  timescale: 1 | 3 | 6 | 9 | 12 | 24; // months
}

export interface SPEIData extends ClimateIndexData {
  timescale: 1 | 3 | 6 | 9 | 12 | 24; // months
}

export interface PDSIData extends ClimateIndexData {
  // Palmer Drought Severity Index
}

export interface HeatIndexData extends ClimateIndexData {
  temperature: number;
  humidity: number;
  feelsLike: number;
}

export interface WindChillData extends ClimateIndexData {
  temperature: number;
  windSpeed: number;
  feelsLike: number;
}

export interface ClimateIndicesResponse {
  coordinates: {
    lat: number;
    lon: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
  spi: SPIData[];
  spei: SPEIData[];
  pdsi: PDSIData[];
  heatIndex: HeatIndexData[];
  windChill: WindChillData[];
  metadata: {
    calculationMethod: string;
    dataSource: string;
    lastUpdated: string;
  };
}

/**
 * Calculate Standardized Precipitation Index (SPI)
 * SPI = (P - P_mean) / P_std
 */
export function calculateSPI(
  precipitation: number[],
  timescale: number = 12
): { value: number; category: string; description: string } {
  if (precipitation.length < timescale) {
    return { value: 0, category: 'Insufficient Data', description: 'Not enough data for calculation' };
  }

  const recentPrecip = precipitation.slice(-timescale);
  const mean = recentPrecip.reduce((sum, val) => sum + val, 0) / recentPrecip.length;
  const variance = recentPrecip.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentPrecip.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return { value: 0, category: 'No Variability', description: 'No precipitation variability detected' };
  }

  const spi = (recentPrecip[recentPrecip.length - 1] - mean) / stdDev;

  let category: string;
  let description: string;

  if (spi >= 2.0) {
    category = 'Extremely Wet';
    description = 'Extremely wet conditions';
  } else if (spi >= 1.5) {
    category = 'Very Wet';
    description = 'Very wet conditions';
  } else if (spi >= 1.0) {
    category = 'Moderately Wet';
    description = 'Moderately wet conditions';
  } else if (spi >= -1.0) {
    category = 'Near Normal';
    description = 'Near normal precipitation';
  } else if (spi >= -1.5) {
    category = 'Moderately Dry';
    description = 'Moderately dry conditions';
  } else if (spi >= -2.0) {
    category = 'Severely Dry';
    description = 'Severely dry conditions';
  } else {
    category = 'Extremely Dry';
    description = 'Extremely dry conditions';
  }

  return { value: spi, category, description };
}

/**
 * Calculate Standardized Precipitation Evapotranspiration Index (SPEI)
 * SPEI = (P - PET - (P - PET)_mean) / (P - PET)_std
 */
export function calculateSPEI(
  precipitation: number[],
  evapotranspiration: number[],
  timescale: number = 12
): { value: number; category: string; description: string } {
  if (precipitation.length !== evapotranspiration.length || precipitation.length < timescale) {
    return { value: 0, category: 'Insufficient Data', description: 'Not enough data for calculation' };
  }

  const waterBalance = precipitation.map((p, i) => p - evapotranspiration[i]);
  const recentBalance = waterBalance.slice(-timescale);
  
  const mean = recentBalance.reduce((sum, val) => sum + val, 0) / recentBalance.length;
  const variance = recentBalance.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentBalance.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return { value: 0, category: 'No Variability', description: 'No water balance variability detected' };
  }

  const spei = (recentBalance[recentBalance.length - 1] - mean) / stdDev;

  let category: string;
  let description: string;

  if (spei >= 2.0) {
    category = 'Extremely Wet';
    description = 'Extremely wet conditions considering temperature';
  } else if (spei >= 1.5) {
    category = 'Very Wet';
    description = 'Very wet conditions considering temperature';
  } else if (spei >= 1.0) {
    category = 'Moderately Wet';
    description = 'Moderately wet conditions considering temperature';
  } else if (spei >= -1.0) {
    category = 'Near Normal';
    description = 'Near normal water balance';
  } else if (spei >= -1.5) {
    category = 'Moderately Dry';
    description = 'Moderately dry conditions considering temperature';
  } else if (spei >= -2.0) {
    category = 'Severely Dry';
    description = 'Severely dry conditions considering temperature';
  } else {
    category = 'Extremely Dry';
    description = 'Extremely dry conditions considering temperature';
  }

  return { value: spei, category, description };
}

/**
 * Calculate Heat Index
 * HI = -42.379 + 2.04901523*T + 10.14333127*RH - 0.22475541*T*RH - 6.83783e-3*T² - 5.481717e-2*RH² + 1.22874e-3*T²*RH + 8.5282e-4*T*RH² - 1.99e-6*T²*RH²
 */
export function calculateHeatIndex(
  temperature: number, // Fahrenheit
  humidity: number // percentage
): { value: number; category: string; description: string; feelsLike: number } {
  const T = temperature;
  const RH = humidity;

  const HI = -42.379 + 
    2.04901523 * T + 
    10.14333127 * RH - 
    0.22475541 * T * RH - 
    6.83783e-3 * T * T - 
    5.481717e-2 * RH * RH + 
    1.22874e-3 * T * T * RH + 
    8.5282e-4 * T * RH * RH - 
    1.99e-6 * T * T * RH * RH;

  let category: string;
  let description: string;

  if (HI >= 130) {
    category = 'Extreme Danger';
    description = 'Heat stroke highly likely';
  } else if (HI >= 105) {
    category = 'Danger';
    description = 'Heat stroke likely, sunstroke possible';
  } else if (HI >= 90) {
    category = 'Extreme Caution';
    description = 'Heat stroke possible with prolonged exposure';
  } else if (HI >= 80) {
    category = 'Caution';
    description = 'Fatigue possible with prolonged exposure';
  } else {
    category = 'Comfortable';
    description = 'Comfortable conditions';
  }

  return { value: HI, category, description, feelsLike: HI };
}

/**
 * Calculate Wind Chill
 * WC = 35.74 + 0.6215*T - 35.75*V^0.16 + 0.4275*T*V^0.16
 */
export function calculateWindChill(
  temperature: number, // Fahrenheit
  windSpeed: number // mph
): { value: number; category: string; description: string; feelsLike: number } {
  if (windSpeed < 3) {
    return { 
      value: temperature, 
      category: 'No Wind Chill', 
      description: 'Wind speed too low for wind chill effect',
      feelsLike: temperature 
    };
  }

  const T = temperature;
  const V = windSpeed;

  const WC = 35.74 + 0.6215 * T - 35.75 * Math.pow(V, 0.16) + 0.4275 * T * Math.pow(V, 0.16);

  let category: string;
  let description: string;

  if (WC <= -50) {
    category = 'Extreme Danger';
    description = 'Frostbite in less than 5 minutes';
  } else if (WC <= -30) {
    category = 'Danger';
    description = 'Frostbite in 10-30 minutes';
  } else if (WC <= -20) {
    category = 'High Risk';
    description = 'Frostbite in 30 minutes';
  } else if (WC <= -10) {
    category = 'Moderate Risk';
    description = 'Frostbite possible in 30 minutes';
  } else if (WC <= 0) {
    category = 'Low Risk';
    description = 'Frostbite unlikely';
  } else {
    category = 'No Risk';
    description = 'No frostbite risk';
  }

  return { value: WC, category, description, feelsLike: WC };
}

/**
 * Calculate Palmer Drought Severity Index (PDSI)
 * This is a simplified version - full PDSI calculation is complex
 */
export function calculatePDSI(
  precipitation: number[],
  temperature: number[],
  potentialET: number[]
): { value: number; category: string; description: string } {
  if (precipitation.length !== temperature.length || precipitation.length !== potentialET.length) {
    return { value: 0, category: 'Insufficient Data', description: 'Data length mismatch' };
  }

  // Simplified PDSI calculation
  const waterBalance = precipitation.map((p, i) => p - potentialET[i]);
  const avgBalance = waterBalance.reduce((sum, val) => sum + val, 0) / waterBalance.length;
  
  // Normalize to PDSI scale (-4 to +4)
  const pdsi = Math.max(-4, Math.min(4, avgBalance / 10));

  let category: string;
  let description: string;

  if (pdsi >= 4.0) {
    category = 'Extremely Wet';
    description = 'Extremely wet conditions';
  } else if (pdsi >= 2.0) {
    category = 'Moderately Wet';
    description = 'Moderately wet conditions';
  } else if (pdsi >= 1.0) {
    category = 'Slightly Wet';
    description = 'Slightly wet conditions';
  } else if (pdsi >= -1.0) {
    category = 'Near Normal';
    description = 'Near normal conditions';
  } else if (pdsi >= -2.0) {
    category = 'Mild Drought';
    description = 'Mild drought conditions';
  } else if (pdsi >= -3.0) {
    category = 'Moderate Drought';
    description = 'Moderate drought conditions';
  } else if (pdsi >= -4.0) {
    category = 'Severe Drought';
    description = 'Severe drought conditions';
  } else {
    category = 'Extreme Drought';
    description = 'Extreme drought conditions';
  }

  return { value: pdsi, category, description };
}

/**
 * Fetch climate indices data
 */
export async function fetchClimateIndices(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  indices: ('spi' | 'spei' | 'pdsi' | 'heat' | 'windchill')[] = ['spi', 'spei']
): Promise<ClimateIndicesResponse> {
  try {
    // This would integrate with climate data APIs
    // For now, returning mock data structure
    const mockData: ClimateIndicesResponse = {
      coordinates: { lat, lon },
      timeRange: { start: startDate, end: endDate },
      spi: generateMockSPIData(startDate, endDate),
      spei: generateMockSPEIData(startDate, endDate),
      pdsi: generateMockPDSIData(startDate, endDate),
      heatIndex: generateMockHeatIndexData(startDate, endDate),
      windChill: generateMockWindChillData(startDate, endDate),
      metadata: {
        calculationMethod: 'Standardized',
        dataSource: 'NASA POWER',
        lastUpdated: new Date().toISOString()
      }
    };

    return mockData;
  } catch (error) {
    console.error('Error fetching climate indices:', error);
    throw new Error('Failed to fetch climate indices');
  }
}

// Mock data generators
function generateMockSPIData(startDate: string, endDate: string): SPIData[] {
  const data: SPIData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    const spi = -2 + Math.random() * 4; // -2 to +2
    const { category, description } = calculateSPI([spi * 10 + 50]); // Mock precipitation
    
    data.push({
      date: d.toISOString().split('T')[0],
      value: spi,
      category,
      description,
      timescale: 12
    });
  }
  
  return data;
}

function generateMockSPEIData(startDate: string, endDate: string): SPEIData[] {
  const data: SPEIData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    const spei = -2 + Math.random() * 4; // -2 to +2
    const { category, description } = calculateSPEI([spei * 10 + 50], [30]); // Mock data
    
    data.push({
      date: d.toISOString().split('T')[0],
      value: spei,
      category,
      description,
      timescale: 12
    });
  }
  
  return data;
}

function generateMockPDSIData(startDate: string, endDate: string): PDSIData[] {
  const data: PDSIData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    const pdsi = -4 + Math.random() * 8; // -4 to +4
    const { category, description } = calculatePDSI([50], [20], [30]); // Mock data
    
    data.push({
      date: d.toISOString().split('T')[0],
      value: pdsi,
      category,
      description
    });
  }
  
  return data;
}

function generateMockHeatIndexData(startDate: string, endDate: string): HeatIndexData[] {
  const data: HeatIndexData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const temp = 70 + Math.random() * 30; // 70-100°F
    const humidity = 30 + Math.random() * 50; // 30-80%
    const { value, category, description, feelsLike } = calculateHeatIndex(temp, humidity);
    
    data.push({
      date: d.toISOString().split('T')[0],
      value,
      category,
      description,
      temperature: temp,
      humidity,
      feelsLike
    });
  }
  
  return data;
}

function generateMockWindChillData(startDate: string, endDate: string): WindChillData[] {
  const data: WindChillData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const temp = 20 + Math.random() * 40; // 20-60°F
    const windSpeed = 5 + Math.random() * 20; // 5-25 mph
    const { value, category, description, feelsLike } = calculateWindChill(temp, windSpeed);
    
    data.push({
      date: d.toISOString().split('T')[0],
      value,
      category,
      description,
      temperature: temp,
      windSpeed,
      feelsLike
    });
  }
  
  return data;
}

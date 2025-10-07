// Data normalization and processing utilities
import type { ClimateDataPoint, AnomalyData, ColorScale } from '@/types';

// Normalize data to 0-1 range
export const normalizeData = (data: number[], min?: number, max?: number): number[] => {
  const dataMin = min ?? Math.min(...data);
  const dataMax = max ?? Math.max(...data);
  const range = dataMax - dataMin;
  
  if (range === 0) return data.map(() => 0.5);
  
  return data.map(value => (value - dataMin) / range);
};

// Calculate anomalies (deviation from historical average)
export const calculateAnomaly = (
  currentValue: number,
  historicalData: number[],
  threshold: number = 2
): AnomalyData => {
  const mean = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
  const stdDev = Math.sqrt(variance);
  
  const anomaly = (currentValue - mean) / stdDev;
  const percentile = calculatePercentile(currentValue, historicalData);
  
  let severity: AnomalyData['severity'] = 'low';
  if (Math.abs(anomaly) > 3) severity = 'extreme';
  else if (Math.abs(anomaly) > 2) severity = 'high';
  else if (Math.abs(anomaly) > 1) severity = 'medium';
  
  return {
    value: currentValue,
    anomaly,
    percentile,
    isAnomaly: Math.abs(anomaly) > threshold,
    severity
  };
};

// Calculate percentile rank
export const calculatePercentile = (value: number, data: number[]): number => {
  const sortedData = [...data].sort((a, b) => a - b);
  const index = sortedData.findIndex(d => d >= value);
  
  if (index === -1) return 100;
  if (index === 0) return 0;
  
  return (index / sortedData.length) * 100;
};

// Generate color scales for different data types
export const getColorScale = (type: string, min: number, max: number): ColorScale => {
  const ranges = {
    precipitation: {
      colors: ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7', '#f7fbff'],
      thresholds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    },
    temperature: {
      colors: ['#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7', '#fddbc7', '#f4a582', '#d6604d', '#b2182b'],
      thresholds: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0]
    },
    ndvi: {
      colors: ['#8b0000', '#ff0000', '#ffff00', '#00ff00', '#006400'],
      thresholds: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    },
    elevation: {
      colors: ['#006837', '#1a9850', '#66bd63', '#a6d96a', '#d9ef8b', '#ffffbf', '#fee08b', '#fdae61', '#f46d43', '#d73027', '#a50026'],
      thresholds: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    },
    risk: {
      colors: ['#2e8b57', '#90ee90', '#ffff00', '#ffa500', '#ff4500', '#8b0000'],
      thresholds: [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    }
  };

  const scale = ranges[type as keyof typeof ranges] || ranges.risk;
  
  return {
    min,
    max,
    colors: scale.colors,
    thresholds: scale.thresholds.map(t => min + (max - min) * t)
  };
};

// Get color for a value based on color scale
export const getColorForValue = (value: number, colorScale: ColorScale): string => {
  const normalizedValue = (value - colorScale.min) / (colorScale.max - colorScale.min);
  
  for (let i = 0; i < colorScale.thresholds.length; i++) {
    if (normalizedValue <= colorScale.thresholds[i]) {
      return colorScale.colors[i];
    }
  }
  
  return colorScale.colors[colorScale.colors.length - 1];
};

// Calculate climate risk index
export const calculateClimateRiskIndex = (
  precipitationAnomaly: number,
  temperatureAnomaly: number,
  ndviAnomaly: number,
  floodRisk: number,
  droughtRisk: number
): number => {
  // Normalize all values to 0-1 range
  const normalizedPrecip = Math.abs(precipitationAnomaly) / 3; // Assume 3 std devs is max
  const normalizedTemp = Math.abs(temperatureAnomaly) / 3;
  const normalizedNDVI = Math.abs(ndviAnomaly) / 3;
  
  // Weighted combination of risk factors
  const weights = {
    precipitation: 0.25,
    temperature: 0.20,
    ndvi: 0.20,
    flood: 0.20,
    drought: 0.15
  };
  
  const riskIndex = 
    normalizedPrecip * weights.precipitation +
    normalizedTemp * weights.temperature +
    normalizedNDVI * weights.ndvi +
    floodRisk * weights.flood +
    droughtRisk * weights.drought;
  
  return Math.min(1, Math.max(0, riskIndex));
};

// Convert date strings to consistent format
export const normalizeDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
};

// Group data by time periods
export const groupDataByPeriod = (
  data: ClimateDataPoint[],
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Record<string, ClimateDataPoint[]> => {
  const grouped: Record<string, ClimateDataPoint[]> = {};
  
  data.forEach(point => {
    const date = new Date(point.date);
    let key: string;
    
    switch (period) {
      case 'daily':
        key = point.date;
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'yearly':
        key = String(date.getFullYear());
        break;
      default:
        key = point.date;
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(point);
  });
  
  return grouped;
};

// Calculate statistics for grouped data
export const calculateGroupStatistics = (group: ClimateDataPoint[]) => {
  const values = group.map(point => point.value);
  
  return {
    count: values.length,
    mean: values.reduce((sum, val) => sum + val, 0) / values.length,
    median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
    min: Math.min(...values),
    max: Math.max(...values),
    stdDev: Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - values.reduce((s, v) => s + v, 0) / values.length, 2), 0) / values.length
    )
  };
};

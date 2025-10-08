import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { chirpsAPI } from '../api/chirps';
import { nasaPowerAPI } from '../api/nasa-power';
import { srtmAPI } from '../api/srtm';
import { floodRiskAPI } from '../api/flood-risk';

/**
 * AI Tools - Allow AI agents to access real climate data
 */

export const getRainfallData = tool({
  description: 'Get rainfall data for a specific location and date range using CHIRPS API',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Latitude in Rwanda (-2.8 to -1.0)'),
    longitude: z.number().min(28.8).max(31.0).describe('Longitude in Rwanda (28.8 to 31.0)'),
    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().describe('End date in YYYY-MM-DD format'),
  })),
  execute: async ({ latitude, longitude, startDate, endDate }) => {
    const data = await chirpsAPI.getRainfallTimeSeries(latitude, longitude, startDate, endDate);

    if (!data) {
      return { error: 'Failed to fetch rainfall data' };
    }

    const values = Object.values(data.data || {}).map((d: any) => d.precipitation);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const recent7Days = values.slice(-7);
    const recent7DaysAvg = recent7Days.reduce((sum, val) => sum + val, 0) / recent7Days.length;

    return {
      location: { latitude, longitude },
      period: { startDate, endDate },
      totalRainfall: total.toFixed(1),
      averageDaily: average.toFixed(2),
      recent7DaysAverage: recent7DaysAvg.toFixed(2),
      dataPoints: values.length,
      dailyValues: values.slice(-30), // Last 30 days
    };
  },
});

export const getTemperatureData = tool({
  description: 'Get temperature data for a location using NASA POWER API',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Latitude in Rwanda'),
    longitude: z.number().min(28.8).max(31.0).describe('Longitude in Rwanda'),
    startDate: z.string().describe('Start date in YYYYMMDD format'),
    endDate: z.string().describe('End date in YYYYMMDD format'),
  })),
  execute: async ({ latitude, longitude, startDate, endDate }) => {
    const data = await nasaPowerAPI.getTemperatureData(latitude, longitude, startDate, endDate);

    if (!data) {
      return { error: 'Failed to fetch temperature data' };
    }

    return {
      location: { latitude, longitude },
      period: { startDate, endDate },
      parameters: data.parameters,
      data: data.properties?.parameter || {},
    };
  },
});

export const getElevationData = tool({
  description: 'Get elevation, slope, and terrain data for a location using SRTM',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Latitude in Rwanda'),
    longitude: z.number().min(28.8).max(31.0).describe('Longitude in Rwanda'),
  })),
  execute: async ({ latitude, longitude }) => {
    const data = await srtmAPI.getElevationData({ lat: latitude, lon: longitude });

    if (!data) {
      return { error: 'Failed to fetch elevation data' };
    }

    return {
      location: { latitude, longitude },
      elevation: Math.round(data.elevation),
      slope: data.slope.toFixed(2),
      aspect: data.aspect.toFixed(2),
      floodRisk: data.floodRisk,
    };
  },
});

export const assessFloodRisk = tool({
  description: 'Calculate comprehensive flood risk for a location combining rainfall, elevation, and slope data',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Latitude in Rwanda'),
    longitude: z.number().min(28.8).max(31.0).describe('Longitude in Rwanda'),
  })),
  execute: async ({ latitude, longitude }) => {
    const risk = await floodRiskAPI.calculateFloodRisk(latitude, longitude);

    if (!risk) {
      return { error: 'Failed to calculate flood risk' };
    }

    return {
      location: { latitude, longitude },
      riskLevel: risk.riskLevel,
      riskScore: (risk.riskScore * 100).toFixed(1) + '%',
      factors: {
        rainfall: {
          recent: risk.factors.rainfall.recent.toFixed(1) + 'mm/day',
          average: risk.factors.rainfall.average.toFixed(1) + 'mm/day',
          anomaly: (risk.factors.rainfall.anomaly * 100).toFixed(0) + '%',
          contribution: (risk.factors.rainfall.contribution * 100).toFixed(0) + '%',
        },
        elevation: {
          value: Math.round(risk.factors.elevation.value) + 'm',
          contribution: (risk.factors.elevation.contribution * 100).toFixed(0) + '%',
        },
        slope: {
          value: risk.factors.slope.value.toFixed(1) + '°',
          contribution: (risk.factors.slope.contribution * 100).toFixed(0) + '%',
        },
      },
      timestamp: risk.timestamp.toISOString(),
    };
  },
});

export const getDroughtRisk = tool({
  description: 'Assess drought risk based on rainfall deficit and historical patterns',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Latitude in Rwanda'),
    longitude: z.number().min(28.8).max(31.0).describe('Longitude in Rwanda'),
    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
    endDate: z.string().describe('End date in YYYY-MM-DD format'),
  })),
  execute: async ({ latitude, longitude, startDate, endDate }) => {
    const risk = await chirpsAPI.getDroughtRisk(latitude, longitude, startDate, endDate);

    if (!risk) {
      return { error: 'Failed to assess drought risk' };
    }

    return {
      location: { latitude, longitude },
      riskLevel: risk.riskLevel,
      droughtScore: (risk.droughtRisk * 100).toFixed(1) + '%',
      averagePrecipitation: risk.averagePrecipitation.toFixed(1) + 'mm/day',
      recentAverage: risk.recentAverage.toFixed(1) + 'mm/day',
      deficit: ((risk.averagePrecipitation - risk.recentAverage) / risk.averagePrecipitation * 100).toFixed(1) + '%',
    };
  },
});

/**
 * Export all tools for AI agents
 */
export const climateTools = {
  getRainfallData,
  getTemperatureData,
  getElevationData,
  assessFloodRisk,
  getDroughtRisk,
};

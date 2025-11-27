import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { nasaPowerAPI } from '../api/nasa-power';
import { srtmAPI } from '../api/srtm';
import { floodRiskAPI } from '../api/flood-risk';
import { resolveLocation, getAllLocations } from '../context/location-resolver';

/**
 * AI Tools - Allow AI agents to access real climate data with smart location resolution
 */

/**
 * Resolve location names to coordinates
 */
export const resolveLocationQuery = tool({
  description: 'Resolve location names (cities, provinces, regions) to coordinates for Rwanda. Use this when user mentions a place name instead of coordinates.',
  inputSchema: zodSchema(z.object({
    locationQuery: z.string().describe('City name, province, region, or area name in Rwanda (e.g., "Kigali", "northern Rwanda", "Eastern Province")'),
  })),
  execute: async ({ locationQuery }) => {
    const result = resolveLocation(locationQuery);

    if (result.found && result.location) {
      return {
        success: true,
        location: result.location,
        name: result.name,
        type: result.type,
        confidence: result.confidence,
        message: `Resolved "${locationQuery}" to ${result.name} at coordinates ${result.location.lat.toFixed(4)}°, ${result.location.lon.toFixed(4)}°`,
        suggestion: result.suggestion,
      };
    }

    // Return alternatives
    const locations = getAllLocations();
    return {
      success: false,
      alternatives: locations.cities.slice(0, 5).map(c => c.name),
      message: `Could not find location "${locationQuery}". Available cities: ${locations.cities.slice(0, 5).map(c => c.name).join(', ')}`,
      suggestion: 'Try using one of the available city names or ask about a general region',
    };
  },
});

export const getRainfallData = tool({
  description: 'Get rainfall data for a specific location and date range using NASA POWER API',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Latitude in Rwanda (-2.8 to -1.0)'),
    longitude: z.number().min(28.8).max(31.0).describe('Longitude in Rwanda (28.8 to 31.0)'),
    startDate: z.string().describe('Start date in YYYYMMDD format'),
    endDate: z.string().describe('End date in YYYYMMDD format'),
  })),
  execute: async ({ latitude, longitude, startDate, endDate }) => {
    const data = await nasaPowerAPI.getRainfallData(latitude, longitude, startDate, endDate);

    if (!data) {
      return { error: 'Failed to fetch rainfall data from NASA POWER API' };
    }

    const rawData = data.properties?.parameter?.PRECTOTCORR || {};

    // Extract data with dates
    const dailyDataWithDates = Object.entries(rawData)
      .filter(([_, value]) => typeof value === 'number' && value >= 0)
      .map(([date, value]) => ({
        date: date, // Format: YYYYMMDD
        value: value as number,
      }));

    if (dailyDataWithDates.length === 0) {
      return { error: 'No rainfall data available for this location and date range' };
    }

    const values = dailyDataWithDates.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const recent7Days = values.slice(-7);
    const recent7DaysAvg = recent7Days.length > 0
      ? recent7Days.reduce((sum, val) => sum + val, 0) / recent7Days.length
      : 0;

    return {
      location: { latitude, longitude },
      period: { startDate, endDate },
      totalRainfall: total.toFixed(1) + ' mm',
      averageDaily: average.toFixed(2) + ' mm/day',
      recent7DaysAverage: recent7DaysAvg.toFixed(2) + ' mm/day',
      dataPoints: values.length,
      dailyValues: values.slice(-30), // Last 30 days (for backward compatibility)
      dailyData: dailyDataWithDates.slice(-30), // Last 30 days with dates (NEW - for visualization)
      source: 'NASA POWER API',
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
  description: 'Assess drought risk based on rainfall deficit and temperature anomalies using NASA POWER data',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Latitude in Rwanda'),
    longitude: z.number().min(28.8).max(31.0).describe('Longitude in Rwanda'),
    startDate: z.string().describe('Start date in YYYYMMDD format'),
    endDate: z.string().describe('End date in YYYYMMDD format'),
  })),
  execute: async ({ latitude, longitude, startDate, endDate }) => {
    try {
      // Fetch rainfall data
      const rainfallData = await nasaPowerAPI.getRainfallData(latitude, longitude, startDate, endDate);

      if (!rainfallData) {
        return { error: 'Failed to fetch rainfall data' };
      }

      const precipValues = rainfallData.properties?.parameter?.PRECTOTCORR
        ? Object.values(rainfallData.properties.parameter.PRECTOTCORR).filter(
            (p): p is number => typeof p === 'number' && p >= 0
          )
        : [];

      if (precipValues.length === 0) {
        return { error: 'No rainfall data available' };
      }

      const averagePrecipitation = precipValues.reduce((sum, val) => sum + val, 0) / precipValues.length;
      const recentPrecipitation = precipValues.slice(-30);
      const recentAverage = recentPrecipitation.reduce((sum, val) => sum + val, 0) / recentPrecipitation.length;

      const deficit = averagePrecipitation > 0
        ? (averagePrecipitation - recentAverage) / averagePrecipitation
        : 0;

      const droughtRisk = Math.max(0, Math.min(1, deficit));

      let riskLevel: string;
      if (droughtRisk > 0.5) riskLevel = 'high';
      else if (droughtRisk > 0.3) riskLevel = 'medium';
      else riskLevel = 'low';

      return {
        location: { latitude, longitude },
        riskLevel,
        droughtScore: (droughtRisk * 100).toFixed(1) + '%',
        averagePrecipitation: averagePrecipitation.toFixed(1) + ' mm/day',
        recentAverage: recentAverage.toFixed(1) + ' mm/day',
        deficit: (deficit * 100).toFixed(1) + '%',
        source: 'NASA POWER API',
      };
    } catch (error) {
      console.error('Drought risk calculation error:', error);
      return { error: 'Failed to calculate drought risk' };
    }
  },
});

/**
 * Get map coordinates and view information
 */
export const getMapView = tool({
  description: 'Get current map view coordinates and zoom level for spatial analysis',
  inputSchema: zodSchema(z.object({
    requestType: z.enum(['current', 'bounds']).describe('Type of map info to retrieve'),
  })),
  execute: async () => {
    // This tool provides a way for the AI to understand map context
    // In a real implementation, this would access the map store
    return {
      message: 'To access current map view, the AI can request coordinates from the user or use provided coordinates',
      suggestion: 'Ask the user to click a location on the map or provide specific coordinates for analysis',
      rwandaBounds: {
        north: -1.0,
        south: -2.8,
        east: 31.0,
        west: 28.8,
      },
    };
  },
});

/**
 * Navigate map to specific location
 */
export const navigateMap = tool({
  description: 'Request to navigate the map to a specific location with coordinates',
  inputSchema: zodSchema(z.object({
    latitude: z.number().min(-2.8).max(-1.0).describe('Target latitude in Rwanda'),
    longitude: z.number().min(28.8).max(31.0).describe('Target longitude in Rwanda'),
    zoom: z.number().min(7).max(18).optional().describe('Optional zoom level (7-18)'),
  })),
  execute: async ({ latitude, longitude, zoom }) => {
    return {
      action: 'navigate',
      coordinates: { latitude, longitude },
      zoom: zoom || 12,
      message: `Map should navigate to coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} at zoom level ${zoom || 12}`,
      instructions: 'This tool signals the intent to navigate. The UI should implement the actual navigation.',
    };
  },
});

/**
 * Analyze multiple locations for comparison
 */
export const compareLocations = tool({
  description: 'Compare climate risk metrics across multiple locations in Rwanda',
  inputSchema: zodSchema(z.object({
    locations: z.array(z.object({
      name: z.string(),
      latitude: z.number().min(-2.8).max(-1.0),
      longitude: z.number().min(28.8).max(31.0),
    })).min(2).max(5).describe('Array of 2-5 locations to compare'),
  })),
  execute: async ({ locations }) => {
    const results = await Promise.all(
      locations.map(async (loc) => {
        const floodRisk = await floodRiskAPI.calculateFloodRisk(loc.latitude, loc.longitude);

        return {
          name: loc.name,
          coordinates: { latitude: loc.latitude, longitude: loc.longitude },
          floodRisk: floodRisk ? {
            level: floodRisk.riskLevel,
            score: (floodRisk.riskScore * 100).toFixed(1) + '%',
          } : null,
        };
      })
    );

    return {
      comparison: results,
      summary: `Analyzed ${results.length} locations for climate risk comparison`,
    };
  },
});

/**
 * Format data into tabular structure for visualization
 */
export const formatTabularData = tool({
  description: 'Format climate data into a tabular structure suitable for visualization. Use this after retrieving rainfall, temperature, or other time-series data when the user asks to "visualize", "see a chart/graph", or "plot the data". Take the dailyData array from getRainfallData (which has date and value fields) and pass it to this tool along with appropriate title and data type.',
  inputSchema: zodSchema(z.object({
    data: z.array(z.object({
      date: z.string().describe('Date in readable format (e.g., "2025-01-20" or "Jan 20")'),
      value: z.number().describe('Numerical value for this data point'),
      label: z.string().optional().describe('Optional label for this data point'),
    })).describe('Array of data points with date and value'),
    dataType: z.enum(['rainfall', 'temperature', 'elevation', 'risk', 'other']).describe('Type of data being visualized'),
    title: z.string().describe('Title for the visualization'),
    unit: z.string().optional().describe('Unit of measurement (e.g., "mm", "°C", "%")'),
  })),
  execute: async ({ data, dataType, title, unit }) => {
    // Helper to format date from YYYYMMDD to readable format
    const formatDate = (dateStr: string) => {
      if (dateStr.length === 8) {
        // YYYYMMDD format
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${month}/${day}`;
      }
      return dateStr; // Already formatted
    };

    // Format data for visualization
    const formattedData = data.map(d => ({
      date: formatDate(d.date),
      value: d.value,
      label: d.label,
    }));

    // Return structured data with a special marker for the UI to detect
    return {
      __type: 'tabular-visualization', // Special marker for UI detection
      visualizationType: 'time-series',
      title,
      dataType,
      unit: unit || '',
      headers: ['Date', 'Value'],
      rows: formattedData.map(d => [d.date, d.value, d.label || '']),
      chartConfig: {
        xAxis: 'Date',
        yAxis: 'Value',
        unit: unit || (dataType === 'rainfall' ? 'mm' : dataType === 'temperature' ? '°C' : ''),
      },
      rawData: formattedData, // For chart library to use directly
      metadata: {
        dataPoints: data.length,
        minValue: Math.min(...data.map(d => d.value)),
        maxValue: Math.max(...data.map(d => d.value)),
        avgValue: data.reduce((sum, d) => sum + d.value, 0) / data.length,
      },
    };
  },
});

/**
 * Export all tools for AI agents
 */
export const climateTools = {
  resolveLocationQuery,
  getRainfallData,
  getTemperatureData,
  getElevationData,
  assessFloodRisk,
  getDroughtRisk,
  getMapView,
  navigateMap,
  compareLocations,
  formatTabularData,
};

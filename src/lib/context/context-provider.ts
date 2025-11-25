/**
 * Context Provider
 *
 * Main context provider that combines all context sources
 */

import type { AIContext, ContextProviderOptions, KnowledgeBase, GeographyData, ClimateData, DataSourcesData } from './types';
import geographyData from './knowledge-base/rwanda-geography.json';
import climateData from './knowledge-base/rwanda-climate.json';
import dataSourcesData from './knowledge-base/data-sources.json';
import { findNearestCity, getRegionForCoordinates } from './location-resolver';

/**
 * Load knowledge base
 */
export function getKnowledgeBase(): KnowledgeBase {
  return {
    geography: geographyData as GeographyData,
    climate: climateData as unknown as ClimateData,
    dataSources: dataSourcesData as DataSourcesData,
  };
}

/**
 * Get current season based on month
 */
export function getCurrentSeason(): typeof climateData.seasons[0] {
  const climate = climateData as unknown as ClimateData;
  const currentMonth = new Date().getMonth() + 1; // 1-12

  return (climate.seasons.find((season) =>
    season.monthNumbers.includes(currentMonth)
  ) || climate.seasons[0]) as unknown as typeof climateData.seasons[0];
}

/**
 * Get climate risk for current month
 */
export function getCurrentClimateRisk(): string {
  const climate = climateData as unknown as ClimateData;
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const monthPattern = climate.monthlyPatterns[currentMonth as keyof typeof climate.monthlyPatterns];

  return monthPattern?.risk || 'low';
}

/**
 * Build complete AI context
 */
export function buildAIContext(options: ContextProviderOptions): AIContext {
  const {
    page,
    agent,
    location,
    locationName,
    data,
    includeKnowledgeBase = true,
  } = options;

  const knowledgeBase = includeKnowledgeBase ? getKnowledgeBase() : {} as KnowledgeBase;

  // Enhance location with nearby city/region info
  const enhancedLocation = location ? {
    ...location,
    name: locationName || findNearestCity(location),
  } : undefined;

  return {
    page: {
      page,
      description: getPageDescription(page),
      activeFeatures: getPageFeatures(page),
    },
    agent: agent,
    location: enhancedLocation,
    data,
    knowledgeBase,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get page description
 */
function getPageDescription(page: string): string {
  const descriptions: Record<string, string> = {
    'map': 'Interactive map showing climate risk layers and spatial data',
    'insights': 'Climate trends, statistics, and historical data analysis',
    'ai-chat': 'AI assistant for climate intelligence and data queries',
    'about': 'Information about the platform and data sources',
    'home': 'Platform overview and quick access to features',
    'notifications': 'Weather alert subscription and notification settings',
  };

  return descriptions[page] || 'Platform page';
}

/**
 * Get page features
 */
function getPageFeatures(page: string): string[] {
  const features: Record<string, string[]> = {
    'map': ['Location selection', 'Risk layers', 'Spatial analysis', 'Interactive visualization'],
    'insights': ['Trend charts', 'Historical data', 'Statistics', 'Extreme weather events'],
    'ai-chat': ['Natural language queries', 'Data analysis', 'Real-time information'],
    'about': ['Platform information', 'Data sources', 'Methodology'],
    'home': ['Overview', 'Quick access', 'Recent updates'],
    'notifications': ['Email alerts', 'Preferences', 'Location-based notifications'],
  };

  return features[page] || [];
}

/**
 * Get location context summary
 */
export function getLocationContextSummary(location?: { lat: number; lon: number; name?: string }): string {
  if (!location) {
    return 'No specific location selected. Using Rwanda center for general queries.';
  }

  const city = findNearestCity(location);
  const region = getRegionForCoordinates(location);

  return `Location: ${location.name || city} (${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°) in ${region}`;
}

/**
 * Get seasonal context
 */
export function getSeasonalContext(): string {
  const season = getCurrentSeason();
  const risk = getCurrentClimateRisk();

  return `Current season: ${season.name} (${season.months.join(', ')}).
Typical conditions: ${season.characteristics.rainfall}, ${season.characteristics.temperature}.
Climate risk level: ${risk}.`;
}

/**
 * Get data context summary
 */
export function getDataContextSummary(data?: { dateRange?: { start: string; end: string }; selectedMetrics?: string[] }): string {
  if (!data) {
    return 'No specific data filters applied.';
  }

  const parts: string[] = [];

  if (data.dateRange) {
    parts.push(`Date range: ${data.dateRange.start} to ${data.dateRange.end}`);
  }

  if (data.selectedMetrics && data.selectedMetrics.length > 0) {
    parts.push(`Metrics: ${data.selectedMetrics.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('. ') : 'No specific data filters applied.';
}

/**
 * Location Resolver
 *
 * Intelligently resolves location names to coordinates
 * Handles cities, provinces, regions, and natural language queries
 */

import type { Coordinates, LocationResolutionResult, GeographyData } from './types';
import geographyData from './knowledge-base/rwanda-geography.json';

const geography = geographyData as GeographyData;

/**
 * Main location resolution function
 */
export function resolveLocation(query: string): LocationResolutionResult {
  const normalizedQuery = query.toLowerCase().trim();

  // Try to find exact city match
  const cityMatch = findCity(normalizedQuery);
  if (cityMatch) {
    return {
      found: true,
      location: { lat: cityMatch.lat, lon: cityMatch.lon },
      name: cityMatch.name,
      type: 'city',
      confidence: 'high',
      suggestion: `Using ${cityMatch.name} coordinates for analysis`,
    };
  }

  // Try to find province match
  const provinceMatch = findProvince(normalizedQuery);
  if (provinceMatch) {
    return {
      found: true,
      location: provinceMatch.coordinates,
      name: provinceMatch.name,
      type: 'province',
      confidence: 'high',
      suggestion: `Using ${provinceMatch.name} center coordinates`,
    };
  }

  // Try to find region match (northern, southern, etc.)
  const regionMatch = findRegion(normalizedQuery);
  if (regionMatch) {
    return {
      found: true,
      location: regionMatch.center,
      name: regionMatch.name,
      type: 'region',
      confidence: 'medium',
      suggestion: `Using ${regionMatch.name} region center`,
    };
  }

  // Check if query mentions "Rwanda" or is too general
  if (normalizedQuery.includes('rwanda') || normalizedQuery.length < 3) {
    return {
      found: true,
      location: geography.defaultCenter,
      name: 'Rwanda Center',
      type: 'default',
      confidence: 'low',
      suggestion: 'Using Rwanda center coordinates for general query',
    };
  }

  // No match found - provide alternatives
  return {
    found: false,
    confidence: 'low',
    alternatives: geography.cities.slice(0, 5).map((c) => c.name),
    suggestion: `Location "${query}" not recognized. Try: ${geography.cities.slice(0, 3).map((c) => c.name).join(', ')}`,
  };
}

/**
 * Find city by name or alias
 */
function findCity(query: string): typeof geography.cities[0] | null {
  return geography.cities.find((city) => {
    // Check main name
    if (city.name.toLowerCase() === query) return true;
    if (city.name.toLowerCase().includes(query)) return true;

    // Check aliases
    if (city.aliases) {
      return city.aliases.some((alias) => alias.toLowerCase() === query || alias.toLowerCase().includes(query));
    }

    return false;
  }) || null;
}

/**
 * Find province by name
 */
function findProvince(query: string): typeof geography.provinces[0] | null {
  return geography.provinces.find((province) => {
    const name = province.name.toLowerCase();
    return name === query || name.includes(query) || query.includes(name.replace(' province', ''));
  }) || null;
}

/**
 * Find region by name or directional reference
 */
function findRegion(query: string): typeof geography.regions.northern | null {
  const regions = geography.regions;

  // Check for directional keywords
  if (query.includes('north')) return regions.northern;
  if (query.includes('south')) return regions.southern;
  if (query.includes('east')) return regions.eastern;
  if (query.includes('west')) return regions.western;
  if (query.includes('central') || query.includes('center') || query.includes('middle')) return regions.central;

  return null;
}

/**
 * Resolve location with fallback to default
 */
export function resolveLocationWithFallback(query: string): Coordinates {
  const result = resolveLocation(query);

  if (result.found && result.location) {
    return result.location;
  }

  // Fallback to Rwanda center
  return geography.defaultCenter;
}

/**
 * Get nearest city to coordinates
 */
export function findNearestCity(coords: Coordinates): string {
  let nearest = geography.cities[0];
  let minDistance = calculateDistance(coords, nearest);

  for (const city of geography.cities.slice(1)) {
    const distance = calculateDistance(coords, city);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest.name;
}

/**
 * Calculate distance between two coordinates (simplified Haversine)
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const latDiff = coord1.lat - coord2.lat;
  const lonDiff = coord1.lon - coord2.lon;
  return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
}

/**
 * Get region name for coordinates
 */
export function getRegionForCoordinates(coords: Coordinates): string {
  const { lat, lon } = coords;
  const regions = geography.regions;

  // Check bounds for each region
  for (const [, region] of Object.entries(regions)) {
    const { bounds } = region;
    if (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lon >= bounds.west &&
      lon <= bounds.east
    ) {
      return region.name;
    }
  }

  return 'Central Rwanda'; // Default fallback
}

/**
 * Get province for coordinates
 */
export function getProvinceForCoordinates(coords: Coordinates): string {
  // Find nearest province center
  let nearest = geography.provinces[0];
  let minDistance = calculateDistance(coords, nearest.coordinates);

  for (const province of geography.provinces.slice(1)) {
    const distance = calculateDistance(coords, province.coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = province;
    }
  }

  return nearest.name;
}

/**
 * Extract coordinates from natural language query
 */
export function extractCoordinatesFromQuery(query: string): Coordinates | null {
  // Try to find coordinate patterns like "-1.95, 30.06" or "lat: -1.95, lon: 30.06"
  const coordPattern = /(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)/;
  const match = query.match(coordPattern);

  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);

    // Validate coordinates are in Rwanda bounds
    if (lat >= geography.bounds.south && lat <= geography.bounds.north &&
        lon >= geography.bounds.west && lon <= geography.bounds.east) {
      return { lat, lon };
    }
  }

  return null;
}

/**
 * Validate if coordinates are within Rwanda
 */
export function isWithinRwanda(coords: Coordinates): boolean {
  const { lat, lon } = coords;
  const { bounds } = geography;

  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lon >= bounds.west &&
    lon <= bounds.east
  );
}

/**
 * Get location description
 */
export function getLocationDescription(coords: Coordinates): string {
  const city = findNearestCity(coords);
  const region = getRegionForCoordinates(coords);

  return `Near ${city}, ${region}`;
}

/**
 * Get all available locations
 */
export function getAllLocations() {
  return {
    cities: geography.cities,
    provinces: geography.provinces,
    regions: Object.values(geography.regions),
    defaultCenter: geography.defaultCenter,
  };
}

/**
 * Search locations by partial name
 */
export function searchLocations(searchTerm: string): Array<{ name: string; type: string; coordinates: Coordinates }> {
  const normalizedSearch = searchTerm.toLowerCase();
  const results: Array<{ name: string; type: string; coordinates: Coordinates }> = [];

  // Search cities
  geography.cities.forEach((city) => {
    if (city.name.toLowerCase().includes(normalizedSearch)) {
      results.push({
        name: city.name,
        type: 'city',
        coordinates: { lat: city.lat, lon: city.lon },
      });
    }
  });

  // Search provinces
  geography.provinces.forEach((province) => {
    if (province.name.toLowerCase().includes(normalizedSearch)) {
      results.push({
        name: province.name,
        type: 'province',
        coordinates: province.coordinates,
      });
    }
  });

  return results;
}

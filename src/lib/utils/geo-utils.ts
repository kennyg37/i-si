// Geospatial utilities for map operations
import type { Coordinates, BoundingBox } from '@/types';

// Alias for backward compatibility
export type Point = Coordinates;

export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (point1: Point, point2: Point): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lon - point1.lon);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Convert degrees to radians
export const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Convert radians to degrees
export const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

// Create bounding box from center point and radius
export const createBoundingBox = (center: Point, radiusKm: number): BoundingBox => {
  const latDelta = radiusKm / 111; // Approximate km per degree latitude
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(center.lat))); // Adjust for longitude
  
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lon + lonDelta,
    west: center.lon - lonDelta
  };
};

// Check if point is within bounding box
export const isPointInBoundingBox = (point: Point, bbox: BoundingBox): boolean => {
  return (
    point.lat >= bbox.south &&
    point.lat <= bbox.north &&
    point.lon >= bbox.west &&
    point.lon <= bbox.east
  );
};

// Create grid of points within bounding box
export const createGrid = (bbox: BoundingBox, gridSize: number): Point[] => {
  const points: Point[] = [];
  const latStep = (bbox.north - bbox.south) / gridSize;
  const lonStep = (bbox.east - bbox.west) / gridSize;
  
  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      points.push({
        lat: bbox.south + i * latStep,
        lon: bbox.west + j * lonStep
      });
    }
  }
  
  return points;
};

// Convert bounding box to array format [west, south, east, north]
export const bboxToArray = (bbox: BoundingBox): [number, number, number, number] => {
  return [bbox.west, bbox.south, bbox.east, bbox.north];
};

// Convert array to bounding box
export const arrayToBbox = (bbox: [number, number, number, number]): BoundingBox => {
  return {
    west: bbox[0],
    south: bbox[1],
    east: bbox[2],
    north: bbox[3]
  };
};

// Calculate center point of bounding box
export const getBoundingBoxCenter = (bbox: BoundingBox): Point => {
  return {
    lat: (bbox.north + bbox.south) / 2,
    lon: (bbox.east + bbox.west) / 2
  };
};

// Create polygon from bounding box
export const createPolygonFromBbox = (bbox: BoundingBox): Polygon => {
  return {
    type: 'Polygon',
    coordinates: [[
      [bbox.west, bbox.south],
      [bbox.east, bbox.south],
      [bbox.east, bbox.north],
      [bbox.west, bbox.north],
      [bbox.west, bbox.south]
    ]]
  };
};

// Interpolate value at point using inverse distance weighting
export const interpolateValue = (
  point: Point,
  dataPoints: Array<{ point: Point; value: number }>,
  power: number = 2
): number => {
  if (dataPoints.length === 0) return 0;
  if (dataPoints.length === 1) return dataPoints[0].value;
  
  let weightedSum = 0;
  let weightSum = 0;
  
  dataPoints.forEach(({ point: dataPoint, value }) => {
    const distance = calculateDistance(point, dataPoint);
    if (distance === 0) return value;
    
    const weight = 1 / Math.pow(distance, power);
    weightedSum += value * weight;
    weightSum += weight;
  });
  
  return weightSum > 0 ? weightedSum / weightSum : 0;
};

// Generate heatmap data from point data
export const generateHeatmapData = (
  bbox: BoundingBox,
  dataPoints: Array<{ point: Point; value: number }>,
  gridSize: number = 50
): Array<{ lat: number; lon: number; value: number }> => {
  const grid = createGrid(bbox, gridSize);
  
  return grid.map(point => ({
    lat: point.lat,
    lon: point.lon,
    value: interpolateValue(point, dataPoints)
  }));
};

// Rwanda-specific utilities
export const RWANDA_BOUNDS: BoundingBox = {
  north: -1.0,
  south: -2.8,
  east: 31.0,
  west: 28.8
};

export const RWANDA_CENTER: Point = {
  lat: -1.9403,
  lon: 29.8739
};

// Major cities in Rwanda
export const RWANDA_CITIES = {
  kigali: { name: 'Kigali', lat: -1.9441, lon: 30.0619 },
  butare: { name: 'Butare', lat: -2.5967, lon: 29.7394 },
  gisenyi: { name: 'Gisenyi', lat: -1.6967, lon: 29.2567 },
  ruhengeri: { name: 'Musanze', lat: -1.5000, lon: 29.6333 },
  byumba: { name: 'Byumba', lat: -1.5833, lon: 30.0667 },
  cyangugu: { name: 'Rusizi', lat: -2.4833, lon: 28.9000 },
  kibuye: { name: 'Karongi', lat: -2.0667, lon: 29.3500 },
  kibungo: { name: 'Kirehe', lat: -2.1667, lon: 30.5500 }
};

// Check if point is within Rwanda
export const isPointInRwanda = (point: Point): boolean => {
  return isPointInBoundingBox(point, RWANDA_BOUNDS);
};

// Get zoom level for Rwanda bounds
export const getRwandaZoomLevel = (): number => {
  return 9; // Increased from 8 to avoid Sentinel-2 resolution errors (requires <200m/pixel)
};

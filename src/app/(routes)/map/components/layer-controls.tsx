'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Satellite, Map as MapIcon } from 'lucide-react';

interface LayerControlsProps {
  selectedLayers: string[];
  onLayersChange: (layers: string[]) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  mapStyle: string;
  onMapStyleChange: (style: string) => void;
}

const layers = [
  // Sentinel Hub Layers
  {
    id: 'ndvi',
    name: 'Vegetation Health (NDVI)',
    description: 'Satellite-based vegetation health monitoring',
    category: 'Sentinel Hub'
  },
  {
    id: 'moisture-index',
    name: 'Moisture Index',
    description: 'Soil moisture and drought monitoring',
    category: 'Sentinel Hub'
  },
  {
    id: 'false-color',
    name: 'False Color Agriculture',
    description: 'Enhanced vegetation and land use visualization',
    category: 'Sentinel Hub'
  },
  {
    id: 'ndwi',
    name: 'Water Detection (NDWI)',
    description: 'Water body and wetland identification',
    category: 'Sentinel Hub'
  },
  
  // NASA GIBS Layers
  {
    id: 'nasa-viirs-flood',
    name: 'NASA Water Mask',
    description: 'Static water body detection layer (375m resolution)',
    category: 'NASA GIBS'
  },
  {
    id: 'nasa-flood-risk',
    name: 'NASA Flood Risk Zones',
    description: 'Areas below 10m elevation (high flood risk)',
    category: 'NASA GIBS'
  },
  {
    id: 'nasa-fire',
    name: 'NASA Fire Detection',
    description: 'Active fire thermal anomalies from VIIRS (375m resolution)',
    category: 'NASA GIBS'
  },
  {
    id: 'nasa-soil-moisture',
    name: 'NASA Soil Moisture',
    description: 'SMAP surface soil moisture estimate (9km resolution)',
    category: 'NASA GIBS'
  },
  {
    id: 'nasa-land-temp',
    name: 'NASA Land Surface Temperature',
    description: 'MODIS land surface temperature for drought monitoring (1km resolution)',
    category: 'NASA GIBS'
  },
  {
    id: 'nasa-ndvi',
    name: 'NASA NDVI Vegetation',
    description: 'MODIS vegetation health and greenness (250m resolution)',
    category: 'NASA GIBS'
  },
  {
    id: 'nasa-rainfall-anomaly',
    name: 'NASA Precipitation',
    description: 'AIRS daily precipitation (25km resolution)',
    category: 'NASA GIBS'
  }
];

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: '5y', label: 'Last 5 years' }
];

const mapStyles = [
  { value: 'streets-v12', label: 'Street Map', icon: MapIcon },
  { value: 'satellite-v9', label: 'Satellite', icon: Satellite },
  { value: 'satellite-streets-v12', label: 'Hybrid', icon: Satellite },
];

export function LayerControls({
  selectedLayers,
  onLayersChange,
  timeRange,
  onTimeRangeChange,
  mapStyle,
  onMapStyleChange
}: LayerControlsProps) {
  const handleLayerToggle = (layerId: string, checked: boolean) => {
    if (checked) {
      onLayersChange([...selectedLayers, layerId]);
    } else {
      onLayersChange(selectedLayers.filter(id => id !== layerId));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Map Style</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {mapStyles.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.value}
                  onClick={() => onMapStyleChange(style.value)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    mapStyle === style.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{style.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Layers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['NASA GIBS', 'Sentinel Hub'].map((category) => {
            const categoryLayers = layers.filter(layer => layer.category === category);
            if (categoryLayers.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                  {category}
                </h4>
                {categoryLayers.map((layer) => {
                  const isSelected = selectedLayers.includes(layer.id);

                  return (
                    <div key={layer.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={layer.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleLayerToggle(layer.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={layer.id}
                          className="cursor-pointer block"
                        >
                          <span className="text-sm font-medium">{layer.name}</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {layer.description}
                          </p>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Range</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Layers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedLayers.length === 0 ? (
              <Badge variant="secondary">No layers selected</Badge>
            ) : (
              selectedLayers.map((layerId) => {
                const layer = layers.find(l => l.id === layerId);
                return (
                  <Badge key={layerId} variant="default">
                    {layer?.name || layerId}
                  </Badge>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

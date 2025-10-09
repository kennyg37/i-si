'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MapLegendProps {
  selectedLayers: string[];
}

const legendData = {
  ndvi: {
    title: 'Vegetation Health (NDVI)',
    items: [
      { color: '#006400', label: 'Very Healthy (0.7-1.0)', value: 'very-healthy' },
      { color: '#00ff00', label: 'Healthy (0.5-0.7)', value: 'healthy' },
      { color: '#ffff00', label: 'Moderate (0.3-0.5)', value: 'moderate' },
      { color: '#ff0000', label: 'Stressed (0.1-0.3)', value: 'stressed' },
      { color: '#8b0000', label: 'Very Stressed (0.0-0.1)', value: 'very-stressed' }
    ]
  },
  'moisture-index': {
    title: 'Moisture Index',
    items: [
      { color: '#ff0000', label: 'Dry Areas (High MSI)', value: 'dry' },
      { color: '#ffcc00', label: 'Moderate Moisture', value: 'moderate' },
      { color: '#66cc00', label: 'Wet Areas (Low MSI)', value: 'wet' }
    ]
  },
  'false-color': {
    title: 'False Color Agriculture',
    items: [
      { color: '#ff0000', label: 'Vegetation (Red)', value: 'vegetation' },
      { color: '#0000ff', label: 'Urban/Bare Soil (Blue)', value: 'urban' },
      { color: '#00ff00', label: 'Water (Green)', value: 'water' }
    ]
  },
  ndwi: {
    title: 'Water Detection (NDWI)',
    items: [
      { color: '#0066cc', label: 'Water Bodies (High NDWI)', value: 'water' },
      { color: '#66ccff', label: 'Wet Areas', value: 'wet' },
      { color: '#66cc66', label: 'Land Areas', value: 'land' },
      { color: '#996633', label: 'Dry Land', value: 'dry-land' }
    ]
  },
  // NASA GIBS Layers
  'nasa-viirs-flood': {
    title: 'NASA VIIRS Flood Detection (3-Day Composite)',
    items: [
      { color: '#0066cc', label: 'Flooded Areas', value: 'flooded' },
      { color: '#003366', label: 'Permanent Water', value: 'permanent-water' },
      { color: '#ffffff', label: 'No Data', value: 'no-data' }
    ]
  },
  'nasa-modis-flood': {
    title: 'NASA MODIS Flood Detection (3-Day Composite)',
    items: [
      { color: '#0066cc', label: 'Flooded Areas', value: 'flooded' },
      { color: '#003366', label: 'Permanent Water', value: 'permanent-water' },
      { color: '#ffffff', label: 'No Data', value: 'no-data' }
    ]
  },
  'nasa-soil-moisture': {
    title: 'NASA Soil Moisture',
    items: [
      { color: '#8B4513', label: 'Very Dry', value: 'very-dry' },
      { color: '#D2691E', label: 'Dry', value: 'dry' },
      { color: '#90EE90', label: 'Moderate', value: 'moderate' },
      { color: '#228B22', label: 'Wet', value: 'wet' },
      { color: '#006400', label: 'Very Wet', value: 'very-wet' }
    ]
  },
  'nasa-land-temp': {
    title: 'NASA Land Surface Temperature',
    items: [
      { color: '#000080', label: 'Very Cold (< 0°C)', value: 'very-cold' },
      { color: '#4169E1', label: 'Cold (0-15°C)', value: 'cold' },
      { color: '#00FF00', label: 'Moderate (15-25°C)', value: 'moderate' },
      { color: '#FFD700', label: 'Warm (25-35°C)', value: 'warm' },
      { color: '#FF4500', label: 'Hot (35-45°C)', value: 'hot' },
      { color: '#8B0000', label: 'Very Hot (> 45°C)', value: 'very-hot' }
    ]
  },
  'nasa-ndvi': {
    title: 'NASA NDVI Vegetation',
    items: [
      { color: '#8B0000', label: 'Very Stressed (< 0.1)', value: 'very-stressed' },
      { color: '#FF0000', label: 'Stressed (0.1-0.3)', value: 'stressed' },
      { color: '#FFFF00', label: 'Moderate (0.3-0.5)', value: 'moderate' },
      { color: '#00FF00', label: 'Healthy (0.5-0.7)', value: 'healthy' },
      { color: '#006400', label: 'Very Healthy (> 0.7)', value: 'very-healthy' }
    ]
  },
  'nasa-rainfall-anomaly': {
    title: 'NASA Rainfall Anomaly',
    items: [
      { color: '#8B0000', label: 'Severe Drought (< -50%)', value: 'severe-drought' },
      { color: '#FF4500', label: 'Moderate Drought (-25% to -50%)', value: 'moderate-drought' },
      { color: '#FFD700', label: 'Mild Drought (-10% to -25%)', value: 'mild-drought' },
      { color: '#90EE90', label: 'Normal (-10% to +10%)', value: 'normal' },
      { color: '#00BFFF', label: 'Above Normal (+10% to +25%)', value: 'above-normal' },
      { color: '#0000FF', label: 'Wet (> +25%)', value: 'wet' }
    ]
  }
};

export function MapLegend({ selectedLayers }: MapLegendProps) {
  if (selectedLayers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select layers to view their legends
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedLayers.map((layerId) => {
          const layer = legendData[layerId as keyof typeof legendData];
          if (!layer) return null;

          return (
            <div key={layerId} className="space-y-2">
              <h4 className="text-sm font-medium">{layer.title}</h4>
              <div className="space-y-1">
                {layer.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-sm border border-border"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

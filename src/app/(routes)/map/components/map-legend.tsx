'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MapLegendProps {
  selectedLayers: string[];
}

const legendData = {
  rainfall: {
    title: 'Rainfall Anomaly',
    items: [
      { color: '#08306b', label: 'Very High (>200%)', value: 'extreme' },
      { color: '#2171b5', label: 'High (150-200%)', value: 'high' },
      { color: '#6baed6', label: 'Normal (80-150%)', value: 'normal' },
      { color: '#c6dbef', label: 'Low (50-80%)', value: 'low' },
      { color: '#f7fbff', label: 'Very Low (<50%)', value: 'very-low' }
    ]
  },
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
  flood: {
    title: 'Flood Risk',
    items: [
      { color: '#ff0000', label: 'High Risk', value: 'high' },
      { color: '#ffa500', label: 'Medium Risk', value: 'medium' },
      { color: '#00ff00', label: 'Low Risk', value: 'low' }
    ]
  },
  drought: {
    title: 'Drought Risk',
    items: [
      { color: '#8b0000', label: 'Extreme Drought', value: 'extreme' },
      { color: '#ff4500', label: 'Severe Drought', value: 'severe' },
      { color: '#ffa500', label: 'Moderate Drought', value: 'moderate' },
      { color: '#ffff00', label: 'Mild Drought', value: 'mild' },
      { color: '#90ee90', label: 'Normal', value: 'normal' }
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

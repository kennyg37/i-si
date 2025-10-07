'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloudRain, Leaf, Droplets, Sun, Waves, AlertTriangle } from 'lucide-react';

interface LayerControlsProps {
  selectedLayers: string[];
  onLayersChange: (layers: string[]) => void;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const layers = [
  {
    id: 'ndvi',
    name: 'Vegetation Health (NDVI)',
    icon: Leaf,
    description: 'Sentinel-2 vegetation stress indicators',
    badge: 'Active'
  },
  {
    id: 'flood-sar',
    name: 'Flood Detection (SAR)',
    icon: Waves,
    description: 'Sentinel-1 SAR real-time flood mapping',
    badge: 'New'
  },
  {
    id: 'flood-risk',
    name: 'Flood Risk Model',
    icon: AlertTriangle,
    description: 'CHIRPS rainfall + SRTM elevation analysis',
    badge: 'New'
  },
  {
    id: 'rainfall',
    name: 'Rainfall Anomaly',
    icon: CloudRain,
    description: 'Precipitation patterns and anomalies'
  },
  {
    id: 'drought',
    name: 'Drought Risk',
    icon: Sun,
    description: 'Drought risk and water stress indicators'
  }
];

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: '5y', label: 'Last 5 years' }
];

export function LayerControls({ 
  selectedLayers, 
  onLayersChange, 
  timeRange, 
  onTimeRangeChange 
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
          <CardTitle className="text-lg">Data Layers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {layers.map((layer) => {
            const Icon = layer.icon;
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
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{layer.name}</span>
                    {layer.badge && (
                      <Badge variant={layer.badge === 'New' ? 'default' : 'secondary'} className="text-xs">
                        {layer.badge}
                      </Badge>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {layer.description}
                  </p>
                </div>
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

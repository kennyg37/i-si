'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';
import { MapContainer } from './components/map-container';
import { LayerControls } from './components/layer-controls';
import { MapLegend } from './components/map-legend';
import { RiskSummary } from './components/risk-summary';
import { LocationDataPanel } from './components/location-data-panel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MapPage() {
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [mapStyle, setMapStyle] = useState('streets-v12');

  return (
    <div className="min-h-screen bg-backgroun pb-10">
      <Navigation />

      <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-background overflow-y-auto">
          <div className="p-4 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Climate Risk Map</h1>
              <p className="text-muted-foreground text-sm">
                Interactive visualization of climate risks across Rwanda
              </p>
            </div>

            <Tabs defaultValue="layers" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="layers" className="space-y-4">
                <LayerControls
                  selectedLayers={selectedLayers}
                  onLayersChange={setSelectedLayers}
                  timeRange={selectedTimeRange}
                  onTimeRangeChange={setSelectedTimeRange}
                  mapStyle={mapStyle}
                  onMapStyleChange={setMapStyle}
                />
                <MapLegend selectedLayers={selectedLayers} />
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <LocationDataPanel />
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <RiskSummary />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative overflow-hidden">
          <MapContainer
            selectedLayers={selectedLayers}
            timeRange={selectedTimeRange}
            mapStyle={mapStyle}
          />
        </div>
      </div>
    </div>
  );
}

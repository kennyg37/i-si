'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { gibsLegends } from '@/lib/api/nasa-gibs-legends';
import type { GibsLayerKey } from '@/lib/api/nasa-gibs';

interface LayerLegendProps {
  selectedLayers: string[];
}

export function LayerLegend({ selectedLayers }: LayerLegendProps) {
  const [expanded, setExpanded] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Filter to only NASA GIBS layers that have legends
  const layersWithLegends = selectedLayers.filter(
    (layerId) => layerId.startsWith('nasa-') && gibsLegends.hasLegend(layerId as GibsLayerKey)
  );

  if (layersWithLegends.length === 0) return null;

  const handleImageError = (layerId: string) => {
    setImageErrors((prev) => new Set(prev).add(layerId));
  };

  return (
    <Card className="absolute bottom-4 right-4 w-80 max-h-[600px] overflow-hidden shadow-lg z-10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <CardTitle className="text-sm">Layer Legends</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
          {layersWithLegends.map((layerId) => {
            const layerKey = layerId as GibsLayerKey;
            const metadata = gibsLegends.getLegendMetadata(layerKey);
            const hasError = imageErrors.has(layerId);

            // Try pre-generated PNG first, fallback to dynamic WMS legend
            const legendUrl = hasError
              ? gibsLegends.getDynamicLegendUrl(layerKey)
              : gibsLegends.getLegendUrl(layerKey, { format: 'png', orientation: 'horizontal' });

            return (
              <div key={layerId} className="space-y-2 border-b pb-3 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {metadata?.layerName.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">{metadata?.description}</p>
                    {metadata?.unit && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {metadata.unit}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {metadata?.type}
                  </Badge>
                </div>

                {legendUrl && (
                  <div className="bg-muted/30 rounded p-2">
                    <img
                      src={legendUrl}
                      alt={`Legend for ${metadata?.layerName}`}
                      className="w-full h-auto"
                      onError={() => handleImageError(layerId)}
                      loading="lazy"
                    />
                  </div>
                )}

                {hasError && (
                  <p className="text-xs text-amber-600">
                    Legend not available for this layer
                  </p>
                )}
              </div>
            );
          })}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Legends provided by{' '}
              <a
                href="https://nasa-gibs.github.io/gibs-api-docs/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                NASA GIBS
              </a>
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

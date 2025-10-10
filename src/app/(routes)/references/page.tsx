import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, BookOpen, Link as LinkIcon, FileText } from 'lucide-react';

export default function ReferencesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold">References</h1>
            <p className="text-lg text-muted-foreground">
              Data sources, methodologies, and technical documentation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-base">NASA POWER</h3>
                  <p className="text-sm text-muted-foreground">
                    Prediction of Worldwide Energy Resources - Meteorological and solar data
                  </p>
                  <a
                    href="https://power.larc.nasa.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    power.larc.nasa.gov
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-base">CHIRPS</h3>
                  <p className="text-sm text-muted-foreground">
                    Climate Hazards Group InfraRed Precipitation with Station data
                  </p>
                  <a
                    href="https://www.chc.ucsb.edu/data/chirps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    chc.ucsb.edu/data/chirps
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-base">Sentinel Hub</h3>
                  <p className="text-sm text-muted-foreground">
                    Sentinel-2 satellite imagery and vegetation indices
                  </p>
                  <a
                    href="https://www.sentinel-hub.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    sentinel-hub.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-base">OpenWeatherMap</h3>
                  <p className="text-sm text-muted-foreground">
                    Current weather conditions and forecasts
                  </p>
                  <a
                    href="https://openweathermap.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    openweathermap.org
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-base">NISR AGOL Geospatial Data</h3>
                  <p className="text-sm text-muted-foreground">
                    National Institute of Statistics of Rwanda - Administrative boundaries, sector office locations, and infrastructure data
                  </p>
                  <a
                    href="https://geospatial-open-data-site-nisrgis.hub.arcgis.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    statistics.gov.rw
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Methodology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-base">Risk Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  Climate risk scores are calculated using multi-parameter analysis including precipitation anomalies,
                  temperature extremes, and vegetation health indices. Data is normalized and weighted based on historical
                  patterns and seasonal variations.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Drought Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Drought conditions are identified through Standardized Precipitation Index (SPI), vegetation stress
                  analysis using NDVI, and soil moisture deficits derived from meteorological parameters.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Flood Risk</h3>
                <p className="text-sm text-muted-foreground">
                  Flood risk assessment combines cumulative precipitation data, elevation analysis, and historical
                  flood patterns to identify areas with elevated flood potential.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-base">Vegetation Health</h3>
                <p className="text-sm text-muted-foreground">
                  NDVI time series analysis tracks vegetation health and identifies stress patterns. Values below
                  seasonal averages trigger vegetation stress alerts.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Technical Stack
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-base">Frontend</h3>
                  <p className="text-sm text-muted-foreground">
                    Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base">Data Visualization</h3>
                  <p className="text-sm text-muted-foreground">
                    Mapbox GL JS, React Map GL, Chart.js, Recharts, Turf.js
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base">State Management</h3>
                  <p className="text-sm text-muted-foreground">
                    TanStack Query, Zustand, React Hook Form, Zod
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-base">API Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Axios, Server-side caching, Edge functions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acknowledgments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This platform leverages open data from NASA, USGS, ESA, and climate research institutions.
                Special thanks to the climate science community for making high-quality Earth observation
                data publicly accessible.
              </p>
            </CardContent>
          </Card>

          <div className="text-center py-6 border-t">
            <p className="text-sm text-muted-foreground">
              I-si Climate Risk Platform - Rwanda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

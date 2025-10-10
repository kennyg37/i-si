'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Droplets, Sun, TrendingUp, MapPin } from 'lucide-react';
import { HistoricalFloodAnalysis } from './historical-flood-analysis';
import { HistoricalDroughtAnalysis } from './historical-drought-analysis';

interface HistoricalModeProps {
  lat?: number;
  lon?: number;
  locationName?: string;
}

export function HistoricalMode({ lat = -1.9403, lon = 29.8739, locationName = 'Kigali, Rwanda' }: HistoricalModeProps) {
  const [activeTab, setActiveTab] = useState<'flood' | 'drought' | 'combined'>('flood');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <History className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl">Historical Climate Analysis Mode</CardTitle>
                <CardDescription className="text-white/90 mt-2">
                  Deep dive into multi-year flood and drought patterns with comprehensive risk assessment
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2 text-lg px-4 py-2">
              <MapPin className="h-4 w-4" />
              {locationName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5" />
                <span className="font-semibold">Flood Analysis</span>
              </div>
              <p className="text-sm text-white/80">
                Track extreme rainfall events, wet periods, and flood risk patterns over multiple years
              </p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-5 w-5" />
                <span className="font-semibold">Drought Analysis</span>
              </div>
              <p className="text-sm text-white/80">
                Analyze precipitation deficits, dry spells, and drought severity across seasons
              </p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Trend Insights</span>
              </div>
              <p className="text-sm text-white/80">
                Understand long-term climate patterns and seasonal variability for better planning
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flood" className="gap-2">
            <Droplets className="h-4 w-4" />
            Flood Risk History
          </TabsTrigger>
          <TabsTrigger value="drought" className="gap-2">
            <Sun className="h-4 w-4" />
            Drought Risk History
          </TabsTrigger>
          <TabsTrigger value="combined" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Combined Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flood" className="mt-6">
          <HistoricalFloodAnalysis lat={lat} lon={lon} />
        </TabsContent>

        <TabsContent value="drought" className="mt-6">
          <HistoricalDroughtAnalysis lat={lat} lon={lon} />
        </TabsContent>

        <TabsContent value="combined" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Combined Climate Risk Assessment</CardTitle>
                <CardDescription>
                  Comprehensive view of both flood and drought patterns showing the full spectrum of climate variability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Info about combined analysis */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Droplets className="h-5 w-5" />
                        Flood Risk Insights
                      </h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Understanding flood patterns helps:
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Identify high-risk periods for infrastructure planning</li>
                        <li>• Develop early warning systems</li>
                        <li>• Improve drainage and water management</li>
                        <li>• Protect agricultural investments</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        Drought Risk Insights
                      </h4>
                      <p className="text-sm text-yellow-800 mb-2">
                        Understanding drought patterns helps:
                      </p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Plan water conservation strategies</li>
                        <li>• Select drought-resistant crops</li>
                        <li>• Manage water resource allocation</li>
                        <li>• Prepare for extended dry periods</li>
                      </ul>
                    </div>
                  </div>

                  {/* Both analyses side by side */}
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4">Detailed Historical Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      View flood and drought analyses in the respective tabs above. Each provides:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-2">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                              <History className="h-6 w-6 text-purple-600" />
                            </div>
                            <h4 className="font-semibold mb-2">Multi-Year Data</h4>
                            <p className="text-sm text-muted-foreground">
                              Analyze 3-10 years of historical climate data
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <h4 className="font-semibold mb-2">Trend Analysis</h4>
                            <p className="text-sm text-muted-foreground">
                              Identify increasing or decreasing risk patterns
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-2">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                              <MapPin className="h-6 w-6 text-orange-600" />
                            </div>
                            <h4 className="font-semibold mb-2">Seasonal Patterns</h4>
                            <p className="text-sm text-muted-foreground">
                              Understand monthly and seasonal risk variations
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Key Features */}
                  <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <CardHeader>
                      <CardTitle className="text-indigo-900">What You will Discover</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-indigo-900 mb-3">📊 Comprehensive Metrics</h4>
                          <ul className="space-y-2 text-sm text-indigo-800">
                            <li>• Risk scores and severity classifications</li>
                            <li>• Extreme event frequencies and patterns</li>
                            <li>• Consecutive wet/dry day analysis</li>
                            <li>• Precipitation deficit/surplus tracking</li>
                            <li>• Month-by-month risk breakdowns</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-indigo-900 mb-3">🎯 Actionable Insights</h4>
                          <ul className="space-y-2 text-sm text-indigo-800">
                            <li>• Peak risk periods for planning</li>
                            <li>• Trend direction (increasing/decreasing)</li>
                            <li>• Agricultural recommendations</li>
                            <li>• Water management strategies</li>
                            <li>• Infrastructure planning guidance</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* NASA POWER Data Source Info */}
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-green-900 mb-2">📡 Data Source: NASA POWER</h4>
                      <p className="text-sm text-green-800">
                        All historical data is sourced from NASA&apos;s POWER (Prediction Of Worldwide Energy Resources) project,
                        providing reliable, satellite-derived climate data from 1981 to present. This analysis uses:
                      </p>
                      <ul className="text-sm text-green-700 mt-2 space-y-1 ml-4">
                        <li>• Daily precipitation measurements (PRECTOTCORR)</li>
                        <li>• Temperature data (T2M, T2M_MAX, T2M_MIN)</li>
                        <li>• Humidity and wind speed measurements</li>
                        <li>• Validated and quality-controlled datasets</li>
                      </ul>
                      <p className="text-xs text-green-600 mt-3">
                        ✓ Free API - No API key required • ✓ Global coverage • ✓ Updated daily
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

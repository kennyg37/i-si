'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MapPin } from 'lucide-react';
import { useMultiPointClimateData } from '@/lib/hooks/use-climate-data';

// Rwanda province centers for data sampling
const RWANDA_PROVINCES = {
  kigali: {
    name: 'Kigali',
    coordinates: { lat: -1.9441, lon: 30.0619 },
    population: 1132686,
    area: 730
  },
  eastern: {
    name: 'Eastern Province',
    coordinates: { lat: -1.5, lon: 30.5 },
    population: 2600000,
    area: 9458
  },
  northern: {
    name: 'Northern Province',
    coordinates: { lat: -1.5, lon: 29.7 },
    population: 1800000,
    area: 3293
  },
  southern: {
    name: 'Southern Province',
    coordinates: { lat: -2.5, lon: 29.7 },
    population: 2600000,
    area: 5963
  },
  western: {
    name: 'Western Province',
    coordinates: { lat: -2.0, lon: 29.3 },
    population: 2400000,
    area: 5884
  }
};

const comparisonMetrics = [
  { key: 'risk', label: 'Overall Risk', color: 'destructive' },
  { key: 'rainfall', label: 'Rainfall Risk', color: 'blue' },
  { key: 'temperature', label: 'Temperature Risk', color: 'orange' },
  { key: 'vegetation', label: 'Vegetation Risk', color: 'green' },
  { key: 'flood', label: 'Flood Risk', color: 'cyan' },
  { key: 'drought', label: 'Drought Risk', color: 'yellow' }
];

const calculateRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
};

export function DistrictComparison() {
  const [selectedMetric, setSelectedMetric] = useState('risk');
  const [selectedTimeRange, setSelectedTimeRange] = useState('1y');

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedTimeRange) {
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '5y':
        start.setFullYear(end.getFullYear() - 5);
        break;
      default:
        start.setFullYear(end.getFullYear() - 1);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [selectedTimeRange]);

  // Prepare points for multi-point data fetching
  const provincePoints = Object.values(RWANDA_PROVINCES).map(province => ({
    lat: province.coordinates.lat,
    lon: province.coordinates.lon
  }));

  // Fetch climate data for all provinces
  const { data: multiPointData, isLoading, error } = useMultiPointClimateData(
    provincePoints,
    startDate,
    endDate
  );

  // Process the data to create district comparison
  const districtData = useMemo(() => {
    if (!multiPointData || multiPointData.length === 0) return {};

    const processedData: Record<string, any> = {};

    Object.entries(RWANDA_PROVINCES).forEach(([key, province], index) => {
      const pointData = multiPointData[index];
      if (!pointData) return;

      const rainfallValues = Object.values(pointData.rainfall?.properties?.parameter?.PRECTOT || {});
      const temperatureValues = Object.values(pointData.temperature?.properties?.parameter?.T2M || {});

      // Calculate risks based on data
      const rainfallRisk = rainfallValues.length > 0 ? (() => {
        const avg = rainfallValues.reduce((sum, val) => sum + val, 0) / rainfallValues.length;
        const variance = rainfallValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / rainfallValues.length;
        const stdDev = Math.sqrt(variance);
        const coefficient = stdDev / avg;
        return Math.min(1, coefficient * 2);
      })() : 0;

      const temperatureRisk = temperatureValues.length > 0 ? (() => {
        const avg = temperatureValues.reduce((sum, val) => sum + val, 0) / temperatureValues.length;
        return avg > 25 ? 0.6 : avg > 20 ? 0.4 : 0.2;
      })() : 0;

      const floodRisk = pointData.elevation?.floodRisk?.score || 0;
      const droughtRisk = 0.3; // Placeholder - would need CHIRPS data
      const vegetationRisk = 1 - droughtRisk; // Inverse relationship

      const overallRisk = (rainfallRisk * 0.3 + temperatureRisk * 0.2 + droughtRisk * 0.2 + floodRisk * 0.2 + vegetationRisk * 0.1);

      processedData[key] = {
        name: province.name,
        risk: overallRisk,
        level: calculateRiskLevel(overallRisk),
        components: {
          rainfall: rainfallRisk,
          temperature: temperatureRisk,
          vegetation: vegetationRisk,
          flood: floodRisk,
          drought: droughtRisk
        },
        population: province.population,
        area: province.area
      };
    });

    return processedData;
  }, [multiPointData]);

  const districts = Object.entries(districtData);
  const sortedDistricts = districts.sort(([, a], [, b]) => {
    const aValue = selectedMetric === 'risk' ? a.risk : a.components[selectedMetric as keyof typeof a.components];
    const bValue = selectedMetric === 'risk' ? b.risk : b.components[selectedMetric as keyof typeof b.components];
    return bValue - aValue;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Province Comparison Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Metric</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {comparisonMetrics.map((metric) => (
                    <SelectItem key={metric.key} value={metric.key}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 3 Months</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="5y">Last 5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load province comparison data. Please check your API configuration.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-2 w-full bg-muted animate-pulse rounded" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Province Rankings */}
      {!isLoading && !error && districts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Province Rankings - {comparisonMetrics.find(m => m.key === selectedMetric)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedDistricts.map(([key, district], index) => {
                const value = selectedMetric === 'risk' 
                  ? district.risk 
                  : district.components[selectedMetric as keyof typeof district.components];
                
                return (
                  <div key={key} className="flex items-center space-x-4 p-3 rounded-lg border">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{district.name}</h3>
                        <Badge variant={district.level === 'high' ? 'destructive' : district.level === 'medium' ? 'default' : 'secondary'}>
                          {(value * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Progress value={value * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Population: {district.population.toLocaleString()}</span>
                        <span>Area: {district.area} km²</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Comparison */}
      {!isLoading && !error && districts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Risk Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Province</th>
                    <th className="text-center p-2">Overall</th>
                    <th className="text-center p-2">Rainfall</th>
                    <th className="text-center p-2">Temperature</th>
                    <th className="text-center p-2">Vegetation</th>
                    <th className="text-center p-2">Flood</th>
                    <th className="text-center p-2">Drought</th>
                  </tr>
                </thead>
                <tbody>
                  {districts.map(([key, district]) => (
                    <tr key={key} className="border-b">
                      <td className="p-2 font-medium">{district.name}</td>
                      <td className="p-2 text-center">
                        <Badge variant={district.level === 'high' ? 'destructive' : district.level === 'medium' ? 'default' : 'secondary'}>
                          {(district.risk * 100).toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="p-2 text-center">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${district.components.rainfall * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(district.components.rainfall * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${district.components.temperature * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(district.components.temperature * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${district.components.vegetation * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(district.components.vegetation * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-cyan-600 h-2 rounded-full" 
                            style={{ width: `${district.components.flood * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(district.components.flood * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-yellow-600 h-2 rounded-full" 
                            style={{ width: `${district.components.drought * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(district.components.drought * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Key Insights */}
      {!isLoading && !error && districts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const highRiskProvinces = districts.filter(([, district]) => district.level === 'high');
              const mediumRiskProvinces = districts.filter(([, district]) => district.level === 'medium');
              const lowRiskProvinces = districts.filter(([, district]) => district.level === 'low');

              return (
                <>
                  {highRiskProvinces.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        <strong>High Risk Areas:</strong> {highRiskProvinces.map(([, district]) => district.name).join(', ')} 
                        {highRiskProvinces.length > 1 ? ' show' : ' shows'} the highest overall climate risk. 
                        Monitor these areas closely for potential climate impacts.
                      </p>
                    </div>
                  )}
                  
                  {mediumRiskProvinces.length > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Moderate Risk:</strong> {mediumRiskProvinces.map(([, district]) => district.name).join(', ')} 
                        {mediumRiskProvinces.length > 1 ? ' show' : ' shows'} moderate risk levels. 
                        Continue monitoring and maintain preparedness measures.
                      </p>
                    </div>
                  )}
                  
                  {lowRiskProvinces.length > 0 && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>Low Risk:</strong> {lowRiskProvinces.map(([, district]) => district.name).join(', ')} 
                        {lowRiskProvinces.length > 1 ? ' show' : ' shows'} the lowest risk levels. 
                        Current conditions are favorable, but continue regular monitoring.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!isLoading && !error && districts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Province Data Available</h3>
              <p className="text-muted-foreground">
                Province comparison data will appear here once your API endpoints are configured and data is available.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

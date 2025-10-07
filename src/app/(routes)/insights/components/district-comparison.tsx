'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

// Mock data for district comparison
const mockDistrictData = {
  kigali: {
    name: 'Kigali',
    risk: 0.75,
    level: 'high',
    components: {
      rainfall: 0.8,
      temperature: 0.7,
      vegetation: 0.6,
      flood: 0.9,
      drought: 0.3
    },
    population: 1132686,
    area: 730
  },
  eastern: {
    name: 'Eastern Province',
    risk: 0.55,
    level: 'medium',
    components: {
      rainfall: 0.6,
      temperature: 0.5,
      vegetation: 0.4,
      flood: 0.7,
      drought: 0.4
    },
    population: 2600000,
    area: 9458
  },
  northern: {
    name: 'Northern Province',
    risk: 0.35,
    level: 'low',
    components: {
      rainfall: 0.4,
      temperature: 0.3,
      vegetation: 0.2,
      flood: 0.5,
      drought: 0.2
    },
    population: 1800000,
    area: 3293
  },
  southern: {
    name: 'Southern Province',
    risk: 0.60,
    level: 'medium',
    components: {
      rainfall: 0.7,
      temperature: 0.6,
      vegetation: 0.5,
      flood: 0.8,
      drought: 0.3
    },
    population: 2600000,
    area: 5963
  },
  western: {
    name: 'Western Province',
    risk: 0.70,
    level: 'high',
    components: {
      rainfall: 0.8,
      temperature: 0.6,
      vegetation: 0.7,
      flood: 0.9,
      drought: 0.2
    },
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

export function DistrictComparison() {
  const [selectedMetric, setSelectedMetric] = useState('risk');
  const [selectedDistricts, setSelectedDistricts] = useState(['kigali', 'eastern', 'northern']);

  const districts = Object.entries(mockDistrictData);
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
          <CardTitle>Comparison Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* District Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>District Rankings - {comparisonMetrics.find(m => m.key === selectedMetric)?.label}</CardTitle>
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

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Risk Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">District</th>
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

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>High Risk Areas:</strong> Kigali and Western Province show the highest overall climate risk, primarily due to flood risk and urban heat island effects.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Moderate Risk:</strong> Eastern and Southern Provinces show moderate risk levels with balanced risk components.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Low Risk:</strong> Northern Province shows the lowest risk levels, with good vegetation health and moderate precipitation patterns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

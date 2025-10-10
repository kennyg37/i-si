'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Thermometer, CloudRain, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface StatisticsCardsProps {
  stats: {
    temperature: {
      average: number;
      max: number;
      min: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    precipitation: {
      total: number;
      average: number;
      max: number;
      rainyDays: number;
    };
  };
  period: number;
}

export function StatisticsCards({ stats, period }: StatisticsCardsProps) {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [explainerContent, setExplainerContent] = useState<{ title: string; content: string }>({ title: '', content: '' });

  const getTemperatureExplanation = () => {
    const avg = stats.temperature.average;
    const trend = stats.temperature.trend;

    let explanation = `The average temperature over the past ${period} days is ${avg.toFixed(1)}°C. `;

    if (trend === 'increasing') {
      explanation += 'Temperatures are rising, which may indicate approaching dry season or climate warming. This could lead to increased water needs for crops and higher evapotranspiration rates.';
    } else if (trend === 'decreasing') {
      explanation += 'Temperatures are declining, possibly indicating approaching rainy season or cooler weather patterns. Monitor for potential frost in highland areas.';
    } else {
      explanation += 'Temperatures remain stable, indicating consistent weather conditions. This is generally favorable for agricultural planning.';
    }

    explanation += `\n\nTemperature range: ${stats.temperature.min.toFixed(1)}°C to ${stats.temperature.max.toFixed(1)}°C, showing a ${(stats.temperature.max - stats.temperature.min).toFixed(1)}°C variation.`;

    return explanation;
  };

  const getPrecipitationExplanation = () => {
    const total = stats.precipitation.total;
    const avg = stats.precipitation.average;
    const rainyDays = stats.precipitation.rainyDays;

    let explanation = `Over the past ${period} days, ${total.toFixed(1)}mm of rain has fallen across ${rainyDays} rainy days, averaging ${avg.toFixed(1)}mm per day. `;

    if (avg < 2) {
      explanation += 'Rainfall is below normal levels. Monitor for drought conditions and consider irrigation strategies. Water conservation is recommended.';
    } else if (avg >= 2 && avg < 5) {
      explanation += 'Rainfall is at moderate levels, suitable for most agricultural activities. Soil moisture should be adequate for crop growth.';
    } else {
      explanation += 'Rainfall is above average. Monitor for potential flooding in low-lying areas. Ensure proper drainage systems are functional.';
    }

    explanation += `\n\nMaximum daily rainfall: ${stats.precipitation.max.toFixed(1)}mm. `;

    if (stats.precipitation.max > 50) {
      explanation += 'High intensity rainfall events observed - increased flood risk.';
    }

    return explanation;
  };

  const getTrendExplanation = () => {
    const trend = stats.temperature.trend;

    let explanation = `Temperature trend analysis over ${period} days shows ${trend} conditions. `;

    if (trend === 'increasing') {
      explanation += 'Rising temperatures can indicate:\n\n• Approaching dry season\n• Increased heat stress on crops\n• Higher water demand for irrigation\n• Potential for drought conditions\n• Increased pest activity\n\nRecommendations: Increase irrigation frequency, apply mulch to conserve soil moisture, monitor crops for heat stress.';
    } else if (trend === 'decreasing') {
      explanation += 'Falling temperatures can indicate:\n\n• Approaching rainy season\n• Reduced evapotranspiration\n• Potential frost risk in highlands\n• Favorable planting conditions\n• Lower water requirements\n\nRecommendations: Plan planting schedules, protect sensitive crops from cold, monitor weather forecasts.';
    } else {
      explanation += 'Stable temperatures indicate:\n\n• Consistent weather patterns\n• Predictable growing conditions\n• Easier agricultural planning\n• Normal seasonal progression\n\nRecommendations: Maintain regular crop management practices, continue monitoring for any changes.';
    }

    return explanation;
  };

  const getRainyDaysExplanation = () => {
    const rainyDays = stats.precipitation.rainyDays;
    const percentage = ((rainyDays / period) * 100).toFixed(0);

    let explanation = `${rainyDays} rainy days recorded (${percentage}% of the period). `;

    if (rainyDays < period * 0.2) {
      explanation += 'Limited rainy days suggest dry conditions. This may impact:\n\n• Soil moisture levels\n• Crop water stress\n• Groundwater recharge\n• River and lake levels\n\nConsider implementing water conservation measures and drought-resistant crop varieties.';
    } else if (rainyDays > period * 0.5) {
      explanation += 'Frequent rainy days indicate wet conditions. This may affect:\n\n• Soil saturation\n• Fungal disease risk\n• Planting and harvesting schedules\n• Road accessibility\n\nEnsure proper drainage, monitor for disease outbreaks, and adjust field operations accordingly.';
    } else {
      explanation += 'Moderate rain frequency is typical for Rwanda. This balanced pattern:\n\n• Supports healthy crop growth\n• Maintains soil moisture\n• Reduces irrigation needs\n• Allows field operations between rains\n\nContinue regular agricultural activities while monitoring weather forecasts.';
    }

    return explanation;
  };

  const openExplainer = (type: 'temperature' | 'precipitation' | 'trend' | 'rainyDays') => {
    let title = '';
    let content = '';

    switch (type) {
      case 'temperature':
        title = 'Temperature Analysis';
        content = getTemperatureExplanation();
        break;
      case 'precipitation':
        title = 'Precipitation Analysis';
        content = getPrecipitationExplanation();
        break;
      case 'trend':
        title = 'Temperature Trend Analysis';
        content = getTrendExplanation();
        break;
      case 'rainyDays':
        title = 'Rainy Days Analysis';
        content = getRainyDaysExplanation();
        break;
    }

    setExplainerContent({ title, content });
    setExplainerOpen(true);
  };

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => openExplainer('temperature')}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Avg Temperature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.temperature.average.toFixed(1)}°C</div>
            <p className="text-xs text-muted-foreground mt-1">
              Range: {stats.temperature.min.toFixed(1)}°C - {stats.temperature.max.toFixed(1)}°C
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => openExplainer('precipitation')}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              Total Rainfall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.precipitation.total.toFixed(1)} mm</div>
            <p className="text-xs text-muted-foreground mt-1">
              Daily avg: {stats.precipitation.average.toFixed(1)} mm
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => openExplainer('trend')}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Temperature Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.temperature.trend}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Over last {period} days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => openExplainer('rainyDays')}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rainy Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.precipitation.rainyDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Max rainfall: {stats.precipitation.max.toFixed(1)} mm
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={explainerOpen} onOpenChange={setExplainerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {explainerContent.title}
            </DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-line">{explainerContent.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

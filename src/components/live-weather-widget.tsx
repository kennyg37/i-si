'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, Sun, Thermometer } from 'lucide-react';
import { nasaPowerAPI } from '@/lib/api/nasa-power';

export function LiveWeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
    // Update every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

      const data = await nasaPowerAPI.getTemperatureData(
        -1.9403, // Kigali
        29.8739,
        dateStr,
        dateStr
      );

      if (data?.properties?.parameter) {
        const temp = Object.values(data.properties.parameter.T2M || {})[0] as number;
        const tempMax = Object.values(data.properties.parameter.T2M_MAX || {})[0] as number;
        const tempMin = Object.values(data.properties.parameter.T2M_MIN || {})[0] as number;

        setWeather({
          temp: temp?.toFixed(1) || 'N/A',
          tempMax: tempMax?.toFixed(1) || 'N/A',
          tempMin: tempMin?.toFixed(1) || 'N/A',
          location: 'Kigali, Rwanda',
          condition: getCondition(temp),
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setLoading(false);
    }
  };

  const getCondition = (temp: number) => {
    if (temp > 28) return { text: 'Hot', icon: Sun, color: 'text-orange-500' };
    if (temp > 24) return { text: 'Warm', icon: Sun, color: 'text-yellow-500' };
    if (temp > 18) return { text: 'Mild', icon: Cloud, color: 'text-blue-400' };
    return { text: 'Cool', icon: Cloud, color: 'text-blue-600' };
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const ConditionIcon = weather.condition.icon;

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Location */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">{weather.location}</p>
            <p className="text-xs text-muted-foreground">
              Updated {new Date().toLocaleTimeString()}
            </p>
          </div>

          {/* Main temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ConditionIcon className={`h-12 w-12 ${weather.condition.color}`} />
              <div>
                <p className="text-4xl font-bold">{weather.temp}°C</p>
                <p className="text-sm text-muted-foreground">{weather.condition.text}</p>
              </div>
            </div>
          </div>

          {/* High/Low */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-sm font-semibold">{weather.tempMax}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-sm font-semibold">{weather.tempMin}°C</p>
              </div>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 justify-center">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live data from NASA POWER</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface ComparisonChartProps {
  data: Array<{
    location: string;
    avgTemperature: number;
    elevation: number;
  }>;
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Temperature Comparison */}
          <div>
            <h4 className="text-sm font-medium mb-3">Average Temperature</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="location" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value.toFixed(1)}°C`]}
                />
                <Bar dataKey="avgTemperature" fill="#ef4444" name="Avg Temp" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Elevation Comparison */}
          <div>
            <h4 className="text-sm font-medium mb-3">Elevation</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="location" type="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', border: 'none', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value.toFixed(0)}m`]}
                />
                <Bar dataKey="elevation" fill="#10b981" name="Elevation" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Droplets, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { useHistoricalFloodRisk } from '@/hooks/use-deep-historical-data';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoricalFloodAnalysisProps {
  lat?: number;
  lon?: number;
}

export function HistoricalFloodAnalysis({ lat = -1.9403, lon = 29.8739 }: HistoricalFloodAnalysisProps) {
  const [timeRange, setTimeRange] = useState<number>(5);
  const { data: floodData, isLoading } = useHistoricalFloodRisk(timeRange, lat, lon);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!floodData || floodData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No historical flood data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const avgFloodRisk = floodData.reduce((sum, d) => sum + d.floodRiskScore, 0) / floodData.length;
  const maxFloodRisk = Math.max(...floodData.map(d => d.floodRiskScore));
  const totalExtremeEvents = floodData.reduce((sum, d) => sum + d.extremeRainfallEvents, 0);
  const highRiskMonths = floodData.filter(d => d.floodRiskScore > 60).length;

  // Find months with highest risk
  const riskByMonth = Array.from({ length: 12 }, (_, i) => {
    const monthData = floodData.filter(d => d.month === i + 1);
    const avgRisk = monthData.length > 0
      ? monthData.reduce((sum, d) => sum + d.floodRiskScore, 0) / monthData.length
      : 0;
    return { month: i + 1, avgRisk };
  });
  const highestRiskMonth = riskByMonth.reduce((max, curr) => curr.avgRisk > max.avgRisk ? curr : max);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Recent trend (last 12 months vs previous 12 months)
  const recentData = floodData.slice(-12);
  const previousData = floodData.slice(-24, -12);
  const recentAvg = recentData.length > 0
    ? recentData.reduce((sum, d) => sum + d.floodRiskScore, 0) / recentData.length
    : 0;
  const previousAvg = previousData.length > 0
    ? previousData.reduce((sum, d) => sum + d.floodRiskScore, 0) / previousData.length
    : 0;
  const trendDirection = recentAvg > previousAvg ? 'increasing' : recentAvg < previousAvg ? 'decreasing' : 'stable';

  // Prepare chart data - Flood Risk Score Over Time
  const riskChartData = {
    labels: floodData.map(d => `${monthNames[d.month - 1]} ${d.year}`),
    datasets: [
      {
        label: 'Flood Risk Score',
        data: floodData.map(d => d.floodRiskScore),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Prepare chart data - Extreme Rainfall Events
  const eventsChartData = {
    labels: floodData.map(d => `${monthNames[d.month - 1]} ${d.year}`),
    datasets: [
      {
        label: 'Extreme Events (>50mm)',
        data: floodData.map(d => d.extremeRainfallEvents),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  // Monthly average risk
  const monthlyRiskData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Average Flood Risk by Month',
        data: riskByMonth.map(m => m.avgRisk),
        backgroundColor: riskByMonth.map(m =>
          m.avgRisk > 60 ? 'rgba(239, 68, 68, 0.6)' :
          m.avgRisk > 40 ? 'rgba(251, 146, 60, 0.6)' :
          'rgba(59, 130, 246, 0.6)'
        ),
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const getRiskBadge = (score: number) => {
    if (score >= 75) return <Badge className="bg-red-600">Extreme</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">High</Badge>;
    if (score >= 25) return <Badge className="bg-yellow-500">Moderate</Badge>;
    return <Badge className="bg-green-600">Low</Badge>;
  };

  const getTrendIcon = () => {
    if (trendDirection === 'increasing') return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (trendDirection === 'decreasing') return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
    return <div className="h-4 w-4 text-gray-600">→</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-6 w-6 text-blue-600" />
                Historical Flood Risk Analysis
              </CardTitle>
              <CardDescription className="mt-2">
                Deep analysis of flood patterns and extreme rainfall events over {timeRange} years
              </CardDescription>
            </div>
            <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="5">5 Years</SelectItem>
                <SelectItem value="7">7 Years</SelectItem>
                <SelectItem value="10">10 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Average Risk</p>
              {getRiskBadge(avgFloodRisk)}
            </div>
            <p className="text-3xl font-bold">{avgFloodRisk.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">Risk Score (0-100)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Extreme Events</p>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-3xl font-bold">{totalExtremeEvents}</p>
            <p className="text-xs text-muted-foreground mt-1">Days with &gt;50mm rainfall</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">High Risk Months</p>
              {getRiskBadge(maxFloodRisk)}
            </div>
            <p className="text-3xl font-bold">{highRiskMonths}</p>
            <p className="text-xs text-muted-foreground mt-1">Months with risk &gt;60</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Recent Trend</p>
              {getTrendIcon()}
            </div>
            <p className="text-3xl font-bold capitalize">{trendDirection}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {recentAvg > previousAvg ? '+' : ''}{(recentAvg - previousAvg).toFixed(1)} vs previous year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flood Risk Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Flood Risk Score Timeline</CardTitle>
          <CardDescription>Monthly flood risk scores based on extreme rainfall and consecutive wet days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={riskChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Extreme Events Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Extreme Rainfall Events</CardTitle>
          <CardDescription>Number of days per month with more than 50mm of rainfall</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={eventsChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Monthly Risk Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Flood Risk Pattern</CardTitle>
          <CardDescription>Average flood risk by month across all {timeRange} years</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={monthlyRiskData} options={chartOptions} />
          </div>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-900">
              ⚠️ Highest Risk Period: {monthNames[highestRiskMonth.month - 1]}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Average risk score of {highestRiskMonth.avgRisk.toFixed(1)} - heightened flood monitoring recommended
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Findings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Pattern Analysis</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Peak flood risk occurs in <strong>{monthNames[highestRiskMonth.month - 1]}</strong></li>
                <li>• {totalExtremeEvents} extreme rainfall events recorded in {timeRange} years</li>
                <li>• Average of {(totalExtremeEvents / timeRange).toFixed(1)} extreme events per year</li>
                <li>• {highRiskMonths} months exceeded high risk threshold (&gt;60)</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Risk Factors</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Heavy rainfall events (&gt;50mm/day)</li>
                <li>• Extended wet periods (consecutive rainy days)</li>
                <li>• Total monthly precipitation volume</li>
                <li>• Maximum daily rainfall intensity</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Recommendations</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Strengthen early warning systems during {monthNames[highestRiskMonth.month - 1]} and adjacent months</li>
              <li>• Improve drainage infrastructure in flood-prone areas</li>
              <li>• Develop community preparedness plans for extreme rainfall events</li>
              <li>• Monitor consecutive rainy day patterns for flash flood potential</li>
              {trendDirection === 'increasing' && (
                <li>• <strong>Note:</strong> Flood risk shows an increasing trend - enhanced monitoring recommended</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

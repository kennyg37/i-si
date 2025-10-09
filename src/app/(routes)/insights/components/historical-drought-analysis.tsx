'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sun, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import { useHistoricalDroughtRisk } from '@/hooks/use-deep-historical-data';
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

interface HistoricalDroughtAnalysisProps {
  lat?: number;
  lon?: number;
}

export function HistoricalDroughtAnalysis({ lat = -1.9403, lon = 29.8739 }: HistoricalDroughtAnalysisProps) {
  const [timeRange, setTimeRange] = useState<number>(5);
  const { data: droughtData, isLoading } = useHistoricalDroughtRisk(timeRange, lat, lon);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!droughtData || droughtData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No historical drought data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const avgDroughtRisk = droughtData.reduce((sum, d) => sum + d.droughtRiskScore, 0) / droughtData.length;
  const maxDroughtRisk = Math.max(...droughtData.map(d => d.droughtRiskScore));
  const totalDryPeriods = droughtData.filter(d => d.consecutiveDryDays > 14).length;
  const severeMonths = droughtData.filter(d => d.droughtRiskScore > 60).length;
  const maxConsecutiveDryDays = Math.max(...droughtData.map(d => d.consecutiveDryDays));

  // Find months with highest drought risk
  const riskByMonth = Array.from({ length: 12 }, (_, i) => {
    const monthData = droughtData.filter(d => d.month === i + 1);
    const avgRisk = monthData.length > 0
      ? monthData.reduce((sum, d) => sum + d.droughtRiskScore, 0) / monthData.length
      : 0;
    return { month: i + 1, avgRisk };
  });
  const highestRiskMonth = riskByMonth.reduce((max, curr) => curr.avgRisk > max.avgRisk ? curr : max);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Recent trend (last 12 months vs previous 12 months)
  const recentData = droughtData.slice(-12);
  const previousData = droughtData.slice(-24, -12);
  const recentAvg = recentData.length > 0
    ? recentData.reduce((sum, d) => sum + d.droughtRiskScore, 0) / recentData.length
    : 0;
  const previousAvg = previousData.length > 0
    ? previousData.reduce((sum, d) => sum + d.droughtRiskScore, 0) / previousData.length
    : 0;
  const trendDirection = recentAvg > previousAvg ? 'increasing' : recentAvg < previousAvg ? 'decreasing' : 'stable';

  // Calculate average precipitation deficit
  const avgDeficit = droughtData.reduce((sum, d) => sum + Math.max(0, d.precipitationDeficit), 0) / droughtData.length;

  // Prepare chart data - Drought Risk Score Over Time
  const riskChartData = {
    labels: droughtData.map(d => `${monthNames[d.month - 1]} ${d.year}`),
    datasets: [
      {
        label: 'Drought Risk Score',
        data: droughtData.map(d => d.droughtRiskScore),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Prepare chart data - Consecutive Dry Days
  const dryDaysChartData = {
    labels: droughtData.map(d => `${monthNames[d.month - 1]} ${d.year}`),
    datasets: [
      {
        label: 'Consecutive Dry Days',
        data: droughtData.map(d => d.consecutiveDryDays),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
      },
    ],
  };

  // Monthly average risk
  const monthlyRiskData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Average Drought Risk by Month',
        data: riskByMonth.map(m => m.avgRisk),
        backgroundColor: riskByMonth.map(m =>
          m.avgRisk > 60 ? 'rgba(234, 179, 8, 0.8)' :
          m.avgRisk > 40 ? 'rgba(249, 115, 22, 0.6)' :
          'rgba(34, 197, 94, 0.6)'
        ),
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1,
      },
    ],
  };

  // Precipitation deficit chart
  const deficitChartData = {
    labels: droughtData.map(d => `${monthNames[d.month - 1]} ${d.year}`),
    datasets: [
      {
        label: 'Precipitation Deficit (mm)',
        data: droughtData.map(d => Math.max(0, d.precipitationDeficit)),
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
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
    if (score >= 75) return <Badge className="bg-yellow-600">Extreme</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Severe</Badge>;
    if (score >= 25) return <Badge className="bg-amber-500">Moderate</Badge>;
    return <Badge className="bg-green-600">Low</Badge>;
  };

  const getTrendIcon = () => {
    if (trendDirection === 'increasing') return <TrendingDown className="h-4 w-4 text-red-600 rotate-180" />;
    if (trendDirection === 'decreasing') return <TrendingDown className="h-4 w-4 text-green-600" />;
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
                <Sun className="h-6 w-6 text-yellow-600" />
                Historical Drought Risk Analysis
              </CardTitle>
              <CardDescription className="mt-2">
                Deep analysis of drought patterns and precipitation deficits over {timeRange} years
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
              {getRiskBadge(avgDroughtRisk)}
            </div>
            <p className="text-3xl font-bold">{avgDroughtRisk.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">Risk Score (0-100)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Max Dry Spell</p>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-3xl font-bold">{maxConsecutiveDryDays}</p>
            <p className="text-xs text-muted-foreground mt-1">Consecutive days without rain</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Severe Months</p>
              {getRiskBadge(maxDroughtRisk)}
            </div>
            <p className="text-3xl font-bold">{severeMonths}</p>
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

      {/* Drought Risk Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Drought Risk Score Timeline</CardTitle>
          <CardDescription>Monthly drought risk scores based on precipitation deficits and dry periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={riskChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Consecutive Dry Days Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Consecutive Dry Days Analysis</CardTitle>
          <CardDescription>Maximum number of consecutive days with less than 1mm rainfall per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={dryDaysChartData} options={chartOptions} />
          </div>
          {maxConsecutiveDryDays > 30 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">
                ⚠️ Critical: {maxConsecutiveDryDays} consecutive dry days detected
              </p>
              <p className="text-xs text-red-700 mt-1">
                Extended dry periods exceeding 30 days indicate severe drought conditions
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Precipitation Deficit */}
      <Card>
        <CardHeader>
          <CardTitle>Precipitation Deficit Analysis</CardTitle>
          <CardDescription>Monthly rainfall deficit compared to long-term average</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Line data={deficitChartData} options={chartOptions} />
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              📊 Average Monthly Deficit: {avgDeficit.toFixed(1)}mm
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Persistent deficits indicate systematic rainfall shortages affecting water resources
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Risk Pattern */}
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Drought Risk Pattern</CardTitle>
          <CardDescription>Average drought risk by month across all {timeRange} years</CardDescription>
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
              Average risk score of {highestRiskMonth.avgRisk.toFixed(1)} - water conservation measures recommended
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Findings & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Pattern Analysis</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Peak drought risk occurs in <strong>{monthNames[highestRiskMonth.month - 1]}</strong></li>
                <li>• {severeMonths} months showed severe drought conditions (&gt;60 risk score)</li>
                <li>• Longest dry spell: {maxConsecutiveDryDays} consecutive days</li>
                <li>• {totalDryPeriods} extended dry periods (&gt;14 days) in {timeRange} years</li>
                <li>• Average precipitation deficit: {avgDeficit.toFixed(1)}mm per month</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Risk Factors</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Precipitation deficit compared to historical average</li>
                <li>• Extended dry periods (consecutive days &lt;1mm rain)</li>
                <li>• Total monthly dry days</li>
                <li>• Absolute low rainfall (&lt;30mm/month)</li>
                <li>• Seasonal variability patterns</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Agricultural & Water Management Recommendations</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Short-term Actions:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Implement water conservation during {monthNames[highestRiskMonth.month - 1]}</li>
                  <li>• Deploy drought-resistant crop varieties</li>
                  <li>• Establish early warning systems for dry spells &gt;7 days</li>
                  <li>• Prioritize irrigation scheduling efficiency</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Long-term Strategies:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Develop rainwater harvesting infrastructure</li>
                  <li>• Improve soil moisture retention capacity</li>
                  <li>• Create water storage reserves for dry seasons</li>
                  <li>• Implement climate-smart agriculture practices</li>
                </ul>
              </div>
            </div>
            {trendDirection === 'increasing' && (
              <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
                <p className="text-sm font-semibold text-red-900">
                  ⚠️ Alert: Drought risk shows an increasing trend - urgent water management planning required
                </p>
              </div>
            )}
          </div>

          {/* Impact Assessment */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Potential Impacts</h4>
            <div className="grid md:grid-cols-3 gap-3 text-sm text-purple-800">
              <div>
                <p className="font-medium mb-1">Agriculture:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Reduced crop yields</li>
                  <li>• Livestock water stress</li>
                  <li>• Soil degradation</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Water Resources:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Depleted groundwater</li>
                  <li>• Reduced river flows</li>
                  <li>• Water supply shortages</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Economy:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Food security concerns</li>
                  <li>• Hydropower limitations</li>
                  <li>• Economic losses</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

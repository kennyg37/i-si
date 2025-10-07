'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Mock data for risk analytics
const mockRiskData = {
  overall: {
    score: 0.65,
    level: 'medium',
    trend: 'increasing',
    change: 0.05
  },
  components: {
    precipitation: {
      score: 0.8,
      level: 'high',
      trend: 'increasing',
      description: 'Above normal precipitation with increased variability'
    },
    temperature: {
      score: 0.6,
      level: 'medium',
      trend: 'increasing',
      description: 'Gradual warming trend observed'
    },
    vegetation: {
      score: 0.3,
      level: 'low',
      trend: 'stable',
      description: 'Vegetation health remains stable'
    },
    flood: {
      score: 0.75,
      level: 'high',
      trend: 'increasing',
      description: 'Elevated flood risk due to heavy rainfall'
    },
    drought: {
      score: 0.25,
      level: 'low',
      trend: 'decreasing',
      description: 'Drought risk remains low'
    }
  },
  timeSeries: [
    { month: 'Jan', risk: 0.45 },
    { month: 'Feb', risk: 0.52 },
    { month: 'Mar', risk: 0.58 },
    { month: 'Apr', risk: 0.65 },
    { month: 'May', risk: 0.68 },
    { month: 'Jun', risk: 0.62 },
    { month: 'Jul', risk: 0.55 },
    { month: 'Aug', risk: 0.48 },
    { month: 'Sep', risk: 0.52 },
    { month: 'Oct', risk: 0.58 },
    { month: 'Nov', risk: 0.65 },
    { month: 'Dec', risk: 0.70 }
  ],
  predictions: {
    nextMonth: 0.72,
    nextQuarter: 0.68,
    nextYear: 0.75
  }
};

const getRiskColor = (level: string) => {
  switch (level) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'increasing': return <TrendingUp className="h-4 w-4 text-destructive" />;
    case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export function RiskAnalytics() {
  const { overall, components, timeSeries, predictions } = mockRiskData;

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Overall Climate Risk Index</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {(overall.score * 100).toFixed(1)}%
              </div>
              <Badge variant={getRiskColor(overall.level) as "default" | "destructive" | "secondary" | "outline"}>
                {overall.level.toUpperCase()} RISK
              </Badge>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center space-x-1">
                {getTrendIcon(overall.trend)}
                <span className="text-sm text-muted-foreground">
                  {overall.trend}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {overall.change > 0 ? '+' : ''}{(overall.change * 100).toFixed(1)}% vs last month
              </div>
            </div>
          </div>
          <Progress value={overall.score * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Risk Components */}
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(components).map(([key, component]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{key}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant={getRiskColor(component.level) as "default" | "destructive" | "secondary" | "outline"}>
                  {component.level}
                </Badge>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(component.trend)}
                  <span className="text-sm text-muted-foreground">
                    {component.trend}
                  </span>
                </div>
              </div>
              <Progress value={component.score * 100} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {component.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Trend Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Trend (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {timeSeries.map((point, index) => (
              <div key={point.month} className="flex items-center space-x-3">
                <div className="w-12 text-sm text-muted-foreground">
                  {point.month}
                </div>
                <div className="flex-1">
                  <Progress value={point.risk * 100} className="h-2" />
                </div>
                <div className="w-12 text-sm text-right">
                  {(point.risk * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {(predictions.nextMonth * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Next Month</div>
              <Badge variant={predictions.nextMonth > 0.7 ? 'destructive' : 'default'}>
                {predictions.nextMonth > 0.7 ? 'High' : 'Medium'}
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {(predictions.nextQuarter * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Next Quarter</div>
              <Badge variant={predictions.nextQuarter > 0.7 ? 'destructive' : 'default'}>
                {predictions.nextQuarter > 0.7 ? 'High' : 'Medium'}
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {(predictions.nextYear * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Next Year</div>
              <Badge variant={predictions.nextYear > 0.7 ? 'destructive' : 'default'}>
                {predictions.nextYear > 0.7 ? 'High' : 'Medium'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Immediate Action:</strong> Monitor flood-prone areas due to elevated precipitation risk.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Medium-term:</strong> Prepare for increased temperature variability and its impact on agriculture.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Long-term:</strong> Continue monitoring vegetation health as current conditions are favorable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

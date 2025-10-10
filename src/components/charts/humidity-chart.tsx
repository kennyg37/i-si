'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type HumidityChartProps = {
  data: Array<{ date: string; humidity: number }>;
  chartType?: 'line' | 'bar' | 'area';
};

export function HumidityChart({ data, chartType = 'line' }: HumidityChartProps) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Relative Humidity (%)',
        data: data.map(d => d.humidity),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: chartType === 'area' ? 'rgba(59, 130, 246, 0.1)' : 'rgb(59, 130, 246)',
        fill: chartType === 'area',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Humidity Levels</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

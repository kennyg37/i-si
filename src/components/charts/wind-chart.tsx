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

type WindChartProps = {
  data: Array<{ date: string; windSpeed: number }>;
  chartType?: 'line' | 'bar' | 'area';
};

export function WindChart({ data, chartType = 'line' }: WindChartProps) {
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Wind Speed (m/s)',
        data: data.map(d => d.windSpeed),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: chartType === 'area' ? 'rgba(139, 92, 246, 0.1)' : 'rgb(139, 92, 246)',
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
          label: (context: any) => `${context.parsed.y.toFixed(1)} m/s`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value} m/s`,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wind Speed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

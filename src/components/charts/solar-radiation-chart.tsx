'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SolarRadiationChartProps = {
  data: Array<{ date: string; solarRadiation: number }>;
  chartType?: 'line' | 'bar' | 'area';
};

export function SolarRadiationChart({ data, chartType = 'bar' }: SolarRadiationChartProps) {
  console.log(chartType)
  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Solar Radiation (W/m²)',
        data: data.map(d => d.solarRadiation),
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 1,
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
          label: (context: any) => `${context.parsed.y.toFixed(1)} W/m²`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value} W/m²`,
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solar Radiation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

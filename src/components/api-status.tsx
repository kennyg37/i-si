'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Wifi } from 'lucide-react';

interface APIStatusProps {
  className?: string;
}

export function APIStatus({ className }: APIStatusProps) {
  const apiStatuses = [
    {
      name: 'NASA POWER',
      status: 'active',
      description: 'Real API with date validation and fallback',
      icon: CheckCircle,
      color: 'green'
    },
    {
      name: 'CHIRPS',
      status: 'active',
      description: 'Real ClimateSERV API with fallback to mock data',
      icon: CheckCircle,
      color: 'green'
    },
    {
      name: 'Sentinel Hub',
      status: 'disabled',
      description: 'Requires API configuration',
      icon: AlertCircle,
      color: 'red'
    },
    {
      name: 'SRTM Elevation',
      status: 'active',
      description: 'Multiple elevation services with fallback',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const getStatusIcon = (status: string, Icon: any) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'mock':
        return <Icon className="h-4 w-4 text-yellow-600" />;
      case 'disabled':
        return <Icon className="h-4 w-4 text-red-600" />;
      default:
        return <Icon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'mock':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Mock Data</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wifi className="h-5 w-5" />
          <span>API Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiStatuses.map((api) => {
          const Icon = api.icon;
          return (
            <div key={api.name} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center space-x-3">
                {getStatusIcon(api.status, Icon)}
                <div>
                  <div className="font-medium text-sm">{api.name}</div>
                  <div className="text-xs text-muted-foreground">{api.description}</div>
                </div>
              </div>
              {getStatusBadge(api.status)}
            </div>
          );
        })}
        
        <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Real API Integration:</strong> The application now uses real APIs for climate and elevation data. 
            APIs include fallback mechanisms to ensure reliability. Configure additional API keys in environment variables for enhanced functionality.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


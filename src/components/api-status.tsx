'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface APIStatusProps {
  className?: string;
}

export function APIStatus({ className }: APIStatusProps) {
  const apiStatuses = [
    {
      name: 'NASA POWER',
      status: 'mock',
      description: 'Using mock data due to date validation',
      icon: Clock,
      color: 'yellow'
    },
    {
      name: 'CHIRPS',
      status: 'mock',
      description: 'Using mock data due to CORS restrictions',
      icon: WifiOff,
      color: 'yellow'
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
      status: 'mock',
      description: 'Using mock elevation data',
      icon: Clock,
      color: 'yellow'
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
        
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Development Mode:</strong> The application is currently using mock data for demonstration purposes. 
            Configure your API endpoints in the environment variables to use real data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

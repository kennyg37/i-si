'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, AlertTriangle, Thermometer, Droplets, Wind, CloudRain, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { useClickedCoordinates } from '@/lib/store/map-store';

// Default coordinates for Rwanda center if no location selected
const RWANDA_CENTER = { lat: -1.9403, lon: 29.8739 };

// Time range options
const timeRangeOptions = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '1y', label: 'Last Year' },
  { value: '2y', label: 'Last 2 Years' }
];

// Mock extreme weather events data
const mockExtremeWeatherEvents = [
  {
    id: 'heat_wave_1',
    type: 'heat_wave',
    severity: 'high',
    startDate: '2024-01-15',
    endDate: '2024-01-18',
    duration: 4,
    intensity: 0.7,
    affectedArea: 500,
    coordinates: { lat: -1.9403, lon: 29.8739 },
    description: 'Heat wave with temperatures exceeding 35°C for 4 consecutive days',
    impacts: { agricultural: 0.6, infrastructure: 0.3, health: 0.8, economic: 0.4 },
    maxTemperature: 36.5,
    minTemperature: 35.2,
    averageTemperature: 35.8,
    consecutiveDays: 4,
    heatIndex: 38.2
  },
  {
    id: 'drought_1',
    type: 'drought',
    severity: 'moderate',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    duration: 28,
    intensity: 0.5,
    affectedArea: 1000,
    coordinates: { lat: -1.9403, lon: 29.8739 },
    description: 'Extended dry period with below-normal precipitation',
    impacts: { agricultural: 0.7, infrastructure: 0.2, health: 0.3, economic: 0.5 },
    precipitationDeficit: 35,
    soilMoistureDeficit: 0.4,
    streamflowDeficit: 25,
    vegetationStress: 0.6
  },
  {
    id: 'flood_1',
    type: 'flood',
    severity: 'high',
    startDate: '2024-03-10',
    endDate: '2024-03-12',
    duration: 3,
    intensity: 0.8,
    affectedArea: 300,
    coordinates: { lat: -1.9403, lon: 29.8739 },
    description: 'Heavy rainfall causing flash flooding in low-lying areas',
    impacts: { agricultural: 0.8, infrastructure: 0.9, health: 0.6, economic: 0.7 },
    precipitationTotal: 150,
    peakIntensity: 25,
    returnPeriod: 10,
    waterLevel: 2.5
  },
  {
    id: 'storm_1',
    type: 'storm',
    severity: 'moderate',
    startDate: '2024-04-05',
    endDate: '2024-04-06',
    duration: 2,
    intensity: 0.6,
    affectedArea: 200,
    coordinates: { lat: -1.9403, lon: 29.8739 },
    description: 'Severe thunderstorm with strong winds and heavy rain',
    impacts: { agricultural: 0.4, infrastructure: 0.5, health: 0.3, economic: 0.4 },
    maxWindSpeed: 25,
    averageWindSpeed: 15,
    precipitationTotal: 80,
    pressure: 1005,
    category: 'Severe'
  }
];

const mockWeatherAlerts = [
  {
    id: 'alert_1',
    type: 'warning',
    severity: 'high',
    event: 'Heat Wave',
    description: 'Extreme heat conditions expected with temperatures reaching 36°C',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    coordinates: { lat: -1.9403, lon: 29.8739 },
    affectedArea: 500,
    recommendations: [
      'Stay hydrated and avoid prolonged outdoor activities',
      'Check on elderly and vulnerable populations',
      'Use air conditioning or fans to stay cool'
    ]
  },
  {
    id: 'alert_2',
    type: 'advisory',
    severity: 'moderate',
    event: 'Drought Conditions',
    description: 'Low soil moisture levels detected (25%)',
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    coordinates: { lat: -1.9403, lon: 29.8739 },
    affectedArea: 1000,
    recommendations: [
      'Implement water conservation measures',
      'Monitor crop conditions closely',
      'Consider irrigation if available'
    ]
  }
];

const getEventIcon = (type: string) => {
  switch (type) {
    case 'heat_wave': return <Thermometer className="h-4 w-4" />;
    case 'drought': return <Droplets className="h-4 w-4" />;
    case 'flood': return <CloudRain className="h-4 w-4" />;
    case 'storm': return <Wind className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'extreme': return 'destructive';
    case 'high': return 'destructive';
    case 'moderate': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};

const getAlertTypeColor = (type: string) => {
  switch (type) {
    case 'warning': return 'destructive';
    case 'watch': return 'default';
    case 'advisory': return 'secondary';
    case 'outlook': return 'outline';
    default: return 'outline';
  }
};

export function ExtremeWeatherEvents() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1y');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const clickedCoordinates = useClickedCoordinates();
  
  // Use clicked coordinates or default to Rwanda center
  const coordinates = clickedCoordinates || RWANDA_CENTER;
  
  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (selectedTimeRange) {
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '2y':
        start.setFullYear(end.getFullYear() - 2);
        break;
      default:
        start.setFullYear(end.getFullYear() - 1);
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [selectedTimeRange]);

  // Filter events based on selection
  const filteredEvents = useMemo(() => {
    let events = mockExtremeWeatherEvents;
    
    if (selectedEventType !== 'all') {
      events = events.filter(event => event.type === selectedEventType);
    }
    
    return events;
  }, [selectedEventType]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const eventsByType = filteredEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const eventsBySeverity = filteredEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageDuration = filteredEvents.reduce((sum, event) => sum + event.duration, 0) / totalEvents || 0;
    const totalImpact = filteredEvents.reduce((sum, event) => {
      const avgImpact = (event.impacts.agricultural + event.impacts.infrastructure + event.impacts.health + event.impacts.economic) / 4;
      return sum + avgImpact;
    }, 0) / totalEvents || 0;

    return {
      totalEvents,
      eventsByType,
      eventsBySeverity,
      averageDuration,
      totalImpact
    };
  }, [filteredEvents]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Extreme Weather Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="heat_wave">Heat Waves</SelectItem>
                  <SelectItem value="drought">Droughts</SelectItem>
                  <SelectItem value="flood">Floods</SelectItem>
                  <SelectItem value="storm">Storms</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm">
                  {clickedCoordinates ? (
                    <div>
                      <div className="font-medium">Selected Location</div>
                      <div className="text-muted-foreground">
                        {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">Rwanda Center</div>
                      <div className="text-muted-foreground">
                        {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              in {selectedTimeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageDuration.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              days per event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary.totalImpact * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              average impact score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockWeatherAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              current warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Weather Alerts */}
      {mockWeatherAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Active Weather Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockWeatherAlerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getAlertTypeColor(alert.type) as "default" | "destructive" | "secondary" | "outline"}>
                        {alert.type.toUpperCase()}
                      </Badge>
                      <Badge variant={getSeverityColor(alert.severity) as "default" | "destructive" | "secondary" | "outline"}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires: {new Date(alert.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <h4 className="font-medium mb-1">{alert.event}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recommendations:</p>
                    {alert.recommendations.map((rec, index) => (
                      <p key={index} className="text-sm text-muted-foreground">• {rec}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Event Types Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Events by Type</h4>
              <div className="space-y-2">
                {Object.entries(summary.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getEventIcon(type)}
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Events by Severity</h4>
              <div className="space-y-2">
                {Object.entries(summary.eventsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{severity}</span>
                    <Badge variant={getSeverityColor(severity) as "default" | "destructive" | "secondary" | "outline"}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Extreme Weather Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getEventIcon(event.type)}
                    <h4 className="font-medium capitalize">{event.type.replace('_', ' ')}</h4>
                    <Badge variant={getSeverityColor(event.severity) as "default" | "destructive" | "secondary" | "outline"}>
                      {event.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                
                <div className="grid md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium">{event.duration} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Intensity</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={event.intensity * 100} className="h-2 flex-1" />
                      <span className="text-sm">{(event.intensity * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Affected Area</p>
                    <p className="font-medium">{event.affectedArea} km²</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Impact</p>
                    <p className="font-medium">
                      {(((event.impacts.agricultural + event.impacts.infrastructure + event.impacts.health + event.impacts.economic) / 4) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Event-specific details */}
                {event.type === 'heat_wave' && (
                  <div className="grid md:grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Max Temperature</p>
                      <p className="font-medium">{event.maxTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Average Temperature</p>
                      <p className="font-medium">{event.averageTemperature}°C</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Heat Index</p>
                      <p className="font-medium">{event.heatIndex}°C</p>
                    </div>
                  </div>
                )}

                {event.type === 'drought' && (
                  <div className="grid md:grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Precipitation Deficit</p>
                      <p className="font-medium">{event.precipitationDeficit} mm</p>
                    </div>
                  </div>
                )}

                {event.type === 'flood' && (
                  <div className="grid md:grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Precipitation</p>
                      <p className="font-medium">{event.precipitationTotal} mm</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Peak Intensity</p>
                      <p className="font-medium">{event.peakIntensity} mm/hr</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Return Period</p>
                      <p className="font-medium">{event.returnPeriod} years</p>
                    </div>
                  </div>
                )}

                {event.type === 'storm' && (
                  <div className="grid md:grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Max Wind Speed</p>
                      <p className="font-medium">{event.maxWindSpeed} m/s</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Average Wind Speed</p>
                      <p className="font-medium">{event.averageWindSpeed} m/s</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{event.category}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* No Events State */}
      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Extreme Weather Events</h3>
              <p className="text-muted-foreground">
                No extreme weather events found for the selected criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

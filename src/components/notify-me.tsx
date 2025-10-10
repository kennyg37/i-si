'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Check, Loader2, Mail, MapPin } from 'lucide-react';
import { useClickedCoordinates } from '@/lib/store/map-store';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/types/notifications';

interface NotifyMeProps {
  defaultCoordinates?: { lat: number; lon: number };
}

export function NotifyMe({ defaultCoordinates }: NotifyMeProps) {
  const clickedCoordinates = useClickedCoordinates();
  const [customCoordinates, setCustomCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const coordinates = customCoordinates || clickedCoordinates || defaultCoordinates || { lat: -1.9403, lon: 29.8739 }; // Rwanda center

  const [email, setEmail] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notification preferences
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);

  // Get user's current location
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomCoordinates({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enter coordinates manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          coordinates,
          preferences,
          location: locationName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEventType = (eventType: keyof typeof preferences.eventTypes) => {
    setPreferences({
      ...preferences,
      eventTypes: {
        ...preferences.eventTypes,
        [eventType]: !preferences.eventTypes[eventType],
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Get Weather Alerts</CardTitle>
        </div>
        <CardDescription>
          Receive email notifications for extreme weather events in your area
        </CardDescription>
      </CardHeader>

      <CardContent>
        {success ? (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <p><strong>Check your email!</strong> We have sent you a verification link to complete your subscription.</p>
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Section */}
            <div className="space-y-3">
              <Label>Alert Location</Label>

              {/* Current Location Display */}
              <div className="p-3 bg-muted rounded-md flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <div className="font-medium">
                      {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                    </div>
                    {customCoordinates ? (
                      <div className="text-xs text-blue-600 mt-1">Using your current location</div>
                    ) : clickedCoordinates ? (
                      <div className="text-xs text-green-600 mt-1">Using selected map location</div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">Using default location (Rwanda center)</div>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseMyLocation}
                >
                  Use My Location
                </Button>
              </div>

              {/* Optional Location Name */}
              <div className="space-y-2">
                <Label htmlFor="location-name" className="text-sm text-muted-foreground">
                  Location Name (Optional)
                </Label>
                <Input
                  id="location-name"
                  type="text"
                  placeholder="e.g., Kigali, My Home"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Add a friendly name to help you identify this location in emails
                </p>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {/* Event Type Preferences */}
            <div className="space-y-3">
              <Label>Event Types to Monitor</Label>
              <div className="space-y-2">
                {Object.entries(preferences.eventTypes).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label htmlFor={key} className="text-sm capitalize cursor-pointer">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={() => toggleEventType(key as keyof typeof preferences.eventTypes)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Level */}
            <div className="space-y-2">
              <Label htmlFor="severity">Minimum Severity Level</Label>
              <Select value={preferences.minSeverity} onValueChange={(value: any) => setPreferences({ ...preferences, minSeverity: value })}>
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - All alerts</SelectItem>
                  <SelectItem value="moderate">Moderate - Important alerts</SelectItem>
                  <SelectItem value="high">High - Serious alerts only</SelectItem>
                  <SelectItem value="extreme">Extreme - Critical alerts only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification Frequency */}
            <div className="space-y-2">
              <Label htmlFor="frequency">Notification Frequency</Label>
              <Select value={preferences.frequency} onValueChange={(value: any) => setPreferences({ ...preferences, frequency: value })}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate - As events occur</SelectItem>
                  <SelectItem value="daily">Daily Digest - Once per day</SelectItem>
                  <SelectItem value="weekly">Weekly Digest - Once per week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Subscribe to Alerts
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By subscribing, you agree to receive weather alerts via email. You can unsubscribe at any time.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

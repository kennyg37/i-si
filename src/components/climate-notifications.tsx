'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function ClimateNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setIsEnabled(true);
        showNotification(
          'Climate Alerts Enabled! 🌍',
          'You will now receive real-time climate risk alerts for Rwanda.',
          { tag: 'welcome' }
        );
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('Failed to enable notifications');
    }
  };

  const toggleNotifications = () => {
    if (isEnabled) {
      setIsEnabled(false);
      toast.success('Notifications disabled');
    } else {
      requestPermission();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Climate Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          {isEnabled ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isEnabled ? 'Alerts Active' : 'Alerts Disabled'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isEnabled
                ? 'You will receive real-time climate risk notifications'
                : 'Enable notifications to get instant climate alerts'}
            </p>
          </div>
        </div>

        <Button onClick={toggleNotifications} variant={isEnabled ? 'outline' : 'default'} className="w-full">
          {isEnabled ? (
            <>
              <BellOff className="h-4 w-4 mr-2" />
              Disable Alerts
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-2" />
              Enable Alerts
            </>
          )}
        </Button>

        {isEnabled && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium">Alert Types:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>✓ Flood risk warnings</p>
              <p>✓ Temperature extremes</p>
              <p>✓ Drought conditions</p>
              <p>✓ Weather anomalies</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to show notifications
export function showNotification(
  title: string,
  body: string,
  options?: NotificationOptions
) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }
}

// Auto-monitor and send alerts
export function useClimateMonitoring(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    // Check for climate alerts every 30 minutes
    const interval = setInterval(() => {
      checkForAlerts();
    }, 30 * 60 * 1000);

    // Check immediately on mount
    checkForAlerts();

    return () => clearInterval(interval);
  }, [enabled]);
}

async function checkForAlerts() {
  // This would connect to your real-time monitoring system
  // For now, it's a placeholder for demonstration
  const hasAlert = Math.random() > 0.9; // 10% chance of alert

  if (hasAlert) {
    showNotification(
      '⚠️ Climate Alert',
      'Unusual temperature patterns detected in Kigali region. Check the dashboard for details.',
      {
        tag: 'climate-alert',
        requireInteraction: true,
      }
    );
  }
}

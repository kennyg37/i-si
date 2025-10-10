/**
 * Email Notification Types
 *
 * Types for weather alert email notifications
 */

export interface EmailSubscription {
  id: string;
  email: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  location?: string; // Optional location name
  preferences: NotificationPreferences;
  isActive: boolean;
  createdAt: string;
  lastNotified?: string;
  verifiedAt?: string;
  unsubscribeToken: string;
}

export interface NotificationPreferences {
  // Event types to receive notifications for
  eventTypes: {
    heatWave: boolean;
    coldWave: boolean;
    drought: boolean;
    flood: boolean;
    storm: boolean;
    heavyRain: boolean;
  };

  // Minimum severity level
  minSeverity: 'low' | 'moderate' | 'high' | 'extreme';

  // Notification frequency
  frequency: 'immediate' | 'daily' | 'weekly';

  // Daily digest time (for daily/weekly frequency)
  digestTime?: string; // HH:MM format
}

export interface WeatherAlertEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  subscription: EmailSubscription;
  alerts: WeatherAlertForEmail[];
}

export interface WeatherAlertForEmail {
  type: string;
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  event: string;
  description: string;
  startDate: string;
  endDate?: string;
  recommendations: string[];
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  eventTypes: {
    heatWave: true,
    coldWave: true,
    drought: true,
    flood: true,
    storm: true,
    heavyRain: true,
  },
  minSeverity: 'moderate',
  frequency: 'immediate',
};

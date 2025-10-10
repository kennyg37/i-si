/**
 * API Route: Send Weather Alert Notifications
 *
 * This endpoint should be called by a cron job or scheduled task
 * to check for weather alerts and send notifications to subscribers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionsNeedingNotifications, updateLastNotified } from '@/lib/db/google-sheets-db';
import { fetchExtremeWeatherEvents } from '@/lib/api/extreme-weather';
import { sendWeatherAlertEmail } from '@/lib/email/mailer';
import { generateWeatherAlertEmail, generateWeatherDigestEmail } from '@/lib/email/templates';
import type { WeatherAlertForEmail } from '@/lib/types/notifications';

// Protect this endpoint with an API key
const CRON_SECRET = process.env.CRON_SECRET || 'development-secret';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Notifications] Starting notification check...');

    // Get subscriptions that need notifications
    const subscriptions = await getSubscriptionsNeedingNotifications();
    console.log(`[Notifications] Found ${subscriptions.length} subscriptions to check`);

    let sentCount = 0;
    let errorCount = 0;

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        // Calculate date range based on frequency
        const endDate = new Date();
        const startDate = new Date();

        if (subscription.preferences.frequency === 'immediate') {
          // Check last 24 hours for immediate notifications
          startDate.setDate(endDate.getDate() - 1);
        } else if (subscription.preferences.frequency === 'daily') {
          // Check last 24 hours for daily digest
          startDate.setDate(endDate.getDate() - 1);
        } else if (subscription.preferences.frequency === 'weekly') {
          // Check last 7 days for weekly digest
          startDate.setDate(endDate.getDate() - 7);
        }

        // Fetch weather events for this location
        const weatherData = await fetchExtremeWeatherEvents(
          subscription.coordinates.lat,
          subscription.coordinates.lon,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Filter events based on user preferences
        const filteredAlerts: WeatherAlertForEmail[] = [];

        // Add alerts from active alerts
        if (weatherData.alerts && weatherData.alerts.length > 0) {
          weatherData.alerts.forEach((alert) => {
            // Check severity threshold
            const severityLevel = { low: 1, moderate: 2, high: 3, extreme: 4 };
            const alertLevel = severityLevel[alert.severity] || 0;
            const minLevel = severityLevel[subscription.preferences.minSeverity] || 0;

            if (alertLevel >= minLevel) {
              filteredAlerts.push({
                type: alert.type,
                severity: alert.severity,
                event: alert.event,
                description: alert.description,
                startDate: alert.issuedAt,
                endDate: alert.expiresAt,
                recommendations: alert.recommendations,
              });
            }
          });
        }

        // Add events from detected extreme weather
        if (weatherData.events && weatherData.events.length > 0) {
          weatherData.events.forEach((event) => {
            // Check if event type is enabled
            const eventTypeKey = event.type.replace('_', '') as keyof typeof subscription.preferences.eventTypes;
            const eventTypeMapping: Record<string, keyof typeof subscription.preferences.eventTypes> = {
              heat_wave: 'heatWave',
              cold_wave: 'coldWave',
              drought: 'drought',
              flood: 'flood',
              storm: 'storm',
              precipitation: 'heavyRain',
            };

            const mappedKey = eventTypeMapping[event.type] || eventTypeKey;

            if (!subscription.preferences.eventTypes[mappedKey]) {
              return;
            }

            // Check severity threshold
            const severityLevel = { low: 1, moderate: 2, high: 3, extreme: 4 };
            const eventLevel = severityLevel[event.severity] || 0;
            const minLevel = severityLevel[subscription.preferences.minSeverity] || 0;

            if (eventLevel >= minLevel) {
              filteredAlerts.push({
                type: event.type,
                severity: event.severity,
                event: event.description.split('.')[0], // Use first sentence as title
                description: event.description,
                startDate: event.startDate,
                endDate: event.endDate,
                recommendations: [], // Could extract from impacts or thresholds
              });
            }
          });
        }

        // Only send email if there are alerts or it's a digest
        if (filteredAlerts.length > 0 || subscription.preferences.frequency !== 'immediate') {
          // Generate email content
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const unsubscribeUrl = `${baseUrl}/api/notifications/unsubscribe?token=${subscription.unsubscribeToken}`;

          let emailContent;

          if (subscription.preferences.frequency === 'immediate') {
            // Immediate notification
            emailContent = generateWeatherAlertEmail(filteredAlerts, subscription, unsubscribeUrl);
          } else {
            // Daily or weekly digest
            const period = subscription.preferences.frequency === 'daily' ? 'daily' : 'weekly';
            emailContent = generateWeatherDigestEmail(filteredAlerts, subscription, unsubscribeUrl, period);
          }

          // Send email
          const emailSent = await sendWeatherAlertEmail({
            to: subscription.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            subscription,
            alerts: filteredAlerts,
          });

          if (emailSent) {
            // Update last notified timestamp
            await updateLastNotified(subscription.id);
            sentCount++;
            console.log(`[Notifications] Sent to ${subscription.email} (${filteredAlerts.length} alerts)`);
          } else {
            errorCount++;
            console.error(`[Notifications] Failed to send to ${subscription.email}`);
          }
        } else {
          console.log(`[Notifications] No alerts for ${subscription.email}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`[Notifications] Error processing ${subscription.email}:`, error);
      }
    }

    console.log(`[Notifications] Complete. Sent: ${sentCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      checked: subscriptions.length,
      sent: sentCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('[Notifications] Send error:', error);
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 });
  }
}

// Allow GET for manual testing (protected)
export async function GET(request: NextRequest) {
  return POST(request);
}

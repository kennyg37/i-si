/**
 * Email Templates for Weather Alerts
 *
 * Generates HTML and text email content
 */

import type { WeatherAlertForEmail, EmailSubscription } from '@/lib/types/notifications';

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'extreme':
      return '#dc2626';
    case 'high':
      return '#ea580c';
    case 'moderate':
      return '#f59e0b';
    case 'low':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'extreme':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'moderate':
      return '⚡';
    case 'low':
      return 'ℹ️';
    default:
      return '📢';
  }
};

const getEventIcon = (type: string): string => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('heat')) return '🌡️';
  if (lowerType.includes('cold')) return '❄️';
  if (lowerType.includes('drought')) return '💧';
  if (lowerType.includes('flood')) return '🌊';
  if (lowerType.includes('storm')) return '⛈️';
  if (lowerType.includes('rain')) return '🌧️';
  return '🌤️';
};

/**
 * Generate weather alert email content
 */
export function generateWeatherAlertEmail(
  alerts: WeatherAlertForEmail[],
  subscription: EmailSubscription,
  unsubscribeUrl: string
): { subject: string; html: string; text: string } {
  const highestSeverity = alerts.reduce((max, alert) => {
    const severityLevel = { low: 1, moderate: 2, high: 3, extreme: 4 };
    const currentLevel = severityLevel[alert.severity] || 0;
    const maxLevel = severityLevel[max] || 0;
    return currentLevel > maxLevel ? alert.severity : max;
  }, 'low');

  const severityIcon = getSeverityIcon(highestSeverity);
  const locationStr = subscription.location || `${subscription.coordinates.lat.toFixed(2)}°, ${subscription.coordinates.lon.toFixed(2)}°`;

  // Email subject
  const subject = `${severityIcon} Weather Alert: ${alerts.length} ${highestSeverity.toUpperCase()} event${alerts.length > 1 ? 's' : ''} in ${locationStr}`;

  // HTML email
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weather Alert</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${severityIcon} Weather Alert</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${locationStr}</p>
        </div>

        <!-- Alert Badge -->
        <div style="background: ${getSeverityColor(highestSeverity)}; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          ${highestSeverity} Severity Alert
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="margin-top: 0; font-size: 16px; color: #555;">
            We've detected <strong>${alerts.length}</strong> active weather alert${alerts.length > 1 ? 's' : ''} for your location. Please review the details below and take necessary precautions.
          </p>

          <!-- Alerts -->
          ${alerts
            .map(
              (alert, index) => `
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid ${getSeverityColor(alert.severity)}; margin: ${index > 0 ? '20px 0 0 0' : '20px 0 0 0'};">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 24px; margin-right: 10px;">${getEventIcon(alert.type)}</span>
                <h3 style="margin: 0; color: #333; font-size: 18px;">${alert.event}</h3>
              </div>

              <div style="display: inline-block; background: ${getSeverityColor(alert.severity)}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px;">
                ${alert.severity}
              </div>

              <p style="margin: 12px 0; color: #555; font-size: 14px; line-height: 1.6;">
                ${alert.description}
              </p>

              ${
                alert.startDate
                  ? `
              <div style="background: white; padding: 12px; border-radius: 4px; margin: 12px 0; font-size: 13px; color: #666;">
                <strong>Period:</strong> ${new Date(alert.startDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}${
                    alert.endDate
                      ? ` - ${new Date(alert.endDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}`
                      : ''
                  }
              </div>
              `
                  : ''
              }

              ${
                alert.recommendations && alert.recommendations.length > 0
                  ? `
              <div style="margin-top: 15px;">
                <strong style="color: #333; font-size: 14px;">⚡ Recommendations:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #555; font-size: 14px;">
                  ${alert.recommendations.map((rec) => `<li style="margin: 5px 0;">${rec}</li>`).join('')}
                </ul>
              </div>
              `
                  : ''
              }
            </div>
          `
            )
            .join('')}

          <!-- Call to Action -->
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
            <p style="margin: 0 0 15px 0; color: #1e40af; font-weight: bold;">Stay informed with real-time updates</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 14px;">
              View Full Dashboard
            </a>
          </div>

          <!-- Tips -->
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              <strong>💡 Safety Tip:</strong> Stay tuned to local authorities for official warnings and evacuation orders. Have an emergency kit ready with water, food, flashlight, and first aid supplies.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p style="margin: 0 0 10px 0;">
            You're receiving this because you subscribed to weather alerts for ${locationStr}
          </p>
          <p style="margin: 0;">
            <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Manage Preferences</a> |
            <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
          </p>
          <p style="margin: 15px 0 0 0; color: #999;">
            © ${new Date().getFullYear()} Rwanda Climate Risk Platform. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  // Plain text email
  const text = `
WEATHER ALERT ${severityIcon}
${locationStr}

${highestSeverity.toUpperCase()} SEVERITY ALERT

We've detected ${alerts.length} active weather alert${alerts.length > 1 ? 's' : ''} for your location.

${alerts
  .map(
    (alert, index) => `
${index + 1}. ${getEventIcon(alert.type)} ${alert.event} - ${alert.severity.toUpperCase()}

${alert.description}

${
  alert.startDate
    ? `Period: ${new Date(alert.startDate).toLocaleDateString()}${alert.endDate ? ` - ${new Date(alert.endDate).toLocaleDateString()}` : ''}`
    : ''
}

${
  alert.recommendations && alert.recommendations.length > 0
    ? `Recommendations:
${alert.recommendations.map((rec) => `• ${rec}`).join('\n')}`
    : ''
}
`
  )
  .join('\n---\n')}

SAFETY TIP: Stay tuned to local authorities for official warnings and evacuation orders. Have an emergency kit ready with water, food, flashlight, and first aid supplies.

---

View full dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'}

You're receiving this because you subscribed to weather alerts for ${locationStr}.

Manage preferences or unsubscribe: ${unsubscribeUrl}

© ${new Date().getFullYear()} Rwanda Climate Risk Platform. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Generate daily/weekly digest email
 */
export function generateWeatherDigestEmail(
  alerts: WeatherAlertForEmail[],
  subscription: EmailSubscription,
  unsubscribeUrl: string,
  period: 'daily' | 'weekly'
): { subject: string; html: string; text: string } {
  const locationStr = subscription.location || `${subscription.coordinates.lat.toFixed(2)}°, ${subscription.coordinates.lon.toFixed(2)}°`;

  const subject = `${period === 'daily' } Your ${period.charAt(0).toUpperCase() + period.slice(1)} Weather Digest - ${locationStr}`;

  if (alerts.length === 0) {
    // No alerts - send "all clear" email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">All Clear!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">${locationStr}</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
            <p>Good news! No extreme weather alerts for your location in the past ${period === 'daily' ? '24 hours' : '7 days'}.</p>
            <p>We'll continue monitoring and notify you if any severe weather conditions develop.</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <a href="${unsubscribeUrl}" style="color: #667eea;">Manage Preferences</a>
          </div>
        </body>
      </html>
    `;

    const text = `All Clear! \n\nNo extreme weather alerts for ${locationStr} in the past ${period === 'daily' ? '24 hours' : '7 days'}.\n\nManage preferences: ${unsubscribeUrl}`;

    return { subject, html, text };
  }

  // Has alerts - use standard template
  return generateWeatherAlertEmail(alerts, subscription, unsubscribeUrl);
}

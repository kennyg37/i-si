/**
 * Email Service using Nodemailer
 *
 * Sends weather alert notifications via email
 */

import nodemailer from 'nodemailer';
import type { WeatherAlertEmail } from '@/lib/types/notifications';

// Email configuration from environment variables
const EMAIL_USER = process.env.EMAIL_USER; // Your Gmail address
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD; // Google App-specific password
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Rwanda Climate Risk Platform';

// Create transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
      throw new Error('Email configuration missing. Set EMAIL_USER and EMAIL_APP_PASSWORD environment variables.');
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD,
      },
    });

    console.log('[Email] Transporter initialized');
  }

  return transporter;
}

/**
 * Send a weather alert email
 */
export async function sendWeatherAlertEmail(
  emailData: WeatherAlertEmail
): Promise<boolean> {
  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });

    console.log('[Email] Weather alert sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send weather alert:', error);
    return false;
  }
}

/**
 * Send a verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationLink: string
): Promise<boolean> {
  try {
    const transport = getTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Rwanda Climate Risk Platform</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Weather Alert Notifications</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>

            <p>Thank you for subscribing to weather alerts! To complete your subscription, please verify your email address by clicking the button below:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
            </div>

            <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all;">${verificationLink}</p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this, you can safely ignore this email.</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Rwanda Climate Risk Platform. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Rwanda Climate Risk Platform - Verify Your Email

      Thank you for subscribing to weather alerts!

      To complete your subscription, please verify your email address by visiting this link:
      ${verificationLink}

      If you didn't request this, you can safely ignore this email.

      © ${new Date().getFullYear()} Rwanda Climate Risk Platform. All rights reserved.
    `;

    const info = await transport.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Rwanda Climate Risk Platform',
      text,
      html,
    });

    console.log('[Email] Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error);
    return false;
  }
}

/**
 * Send a welcome email after verification
 */
export async function sendWelcomeEmail(
  email: string,
  location: string
): Promise<boolean> {
  try {
    const transport = getTransporter();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Weather Alerts</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome!</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">You're all set for weather alerts</p>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Email Verified Successfully!</h2>

            <p>Great news! Your email has been verified and you're now subscribed to weather alerts for <strong>${location}</strong>.</p>

            <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">What to Expect</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Timely alerts for extreme weather events</li>
                <li>Heat waves, floods, droughts, and storms</li>
                <li>Actionable recommendations</li>
                <li>Real-time weather data from Open-Meteo</li>
              </ul>
            </div>

            <p>You can manage your notification preferences or unsubscribe at any time from the links in our alert emails.</p>

            <p style="margin-top: 30px;">Stay safe and informed!</p>
            <p><strong>- Rwanda Climate Risk Platform Team</strong></p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Rwanda Climate Risk Platform. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to Rwanda Climate Risk Platform!

      Email Verified Successfully!

      Great news! Your email has been verified and you're now subscribed to weather alerts for ${location}.

      What to Expect:
      - Timely alerts for extreme weather events
      - Heat waves, floods, droughts, and storms
      - Actionable recommendations
      - Real-time weather data from Open-Meteo

      You can manage your notification preferences or unsubscribe at any time from the links in our alert emails.

      Stay safe and informed!
      - Rwanda Climate Risk Platform Team

      © ${new Date().getFullYear()} Rwanda Climate Risk Platform. All rights reserved.
    `;

    const info = await transport.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Weather Alerts! 🎉',
      text,
      html,
    });

    console.log('[Email] Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Verify transporter configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('[Email] Configuration verified successfully');
    return true;
  } catch (error) {
    console.error('[Email] Configuration verification failed:', error);
    return false;
  }
}

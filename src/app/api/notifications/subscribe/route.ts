/**
 * API Route: Subscribe to Email Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/db/google-sheets-db';
import { sendVerificationEmail } from '@/lib/email/mailer';
import type { NotificationPreferences } from '@/lib/types/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, coordinates, preferences, location } = body;

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lon !== 'number') {
      return NextResponse.json({ error: 'Valid coordinates are required' }, { status: 400 });
    }

    // Create subscription
    const subscription = await createSubscription(
      email,
      coordinates,
      preferences as NotificationPreferences,
      location
    );

    // Generate verification link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const verificationLink = `${baseUrl}/api/notifications/verify?id=${subscription.id}`;

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationLink);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription created. Please check your email to verify.',
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('[API] Subscribe error:', error);

    if (error instanceof Error && error.message === 'Email already subscribed') {
      return NextResponse.json({ error: 'This email is already subscribed' }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

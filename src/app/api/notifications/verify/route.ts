/**
 * API Route: Verify Email Subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySubscription, getSubscription } from '@/lib/db/subscriptions-db';
import { sendWelcomeEmail } from '@/lib/email/mailer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.redirect(new URL('/verify-failed?reason=missing_id', request.url));
    }

    // Get subscription before verifying to check if it exists
    const existingSub = await getSubscription(id);
    if (!existingSub) {
      return NextResponse.redirect(new URL('/verify-failed?reason=not_found', request.url));
    }

    // Check if already verified
    if (existingSub.isActive) {
      return NextResponse.redirect(new URL('/verify-success?already=true', request.url));
    }

    // Verify subscription
    const subscription = await verifySubscription(id);

    if (!subscription) {
      return NextResponse.redirect(new URL('/verify-failed?reason=verification_failed', request.url));
    }

    // Send welcome email
    const locationStr = subscription.location || `${subscription.coordinates.lat.toFixed(2)}°, ${subscription.coordinates.lon.toFixed(2)}°`;
    await sendWelcomeEmail(subscription.email, locationStr);

    // Redirect to success page
    return NextResponse.redirect(new URL('/verify-success', request.url));
  } catch (error) {
    console.error('[API] Verify error:', error);
    return NextResponse.redirect(new URL('/verify-failed?reason=error', request.url));
  }
}

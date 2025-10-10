/**
 * API Route: Unsubscribe from Email Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeByToken } from '@/lib/db/google-sheets-db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/unsubscribe-failed?reason=missing_token', request.url));
    }

    // Unsubscribe
    const success = await unsubscribeByToken(token);

    if (!success) {
      return NextResponse.redirect(new URL('/unsubscribe-failed?reason=not_found', request.url));
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/unsubscribe-success', request.url));
  } catch (error) {
    console.error('[API] Unsubscribe error:', error);
    return NextResponse.redirect(new URL('/unsubscribe-failed?reason=error', request.url));
  }
}

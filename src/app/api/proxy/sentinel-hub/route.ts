import { NextRequest, NextResponse } from 'next/server';

const SENTINEL_CLIENT_ID = process.env.NEXT_PUBLIC_SENTINEL_CLIENT_ID;
const SENTINEL_CLIENT_SECRET = process.env.NEXT_PUBLIC_SENTINEL_CLIENT_SECRET;

/**
 * Proxy for Sentinel Hub OAuth token requests to avoid CORS issues
 */
export async function POST(req: NextRequest) {
  try {
    const { action, ...body } = await req.json();

    // Handle OAuth token request
    if (action === 'token') {
      const tokenResponse = await fetch('https://services.sentinel-hub.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: SENTINEL_CLIENT_ID || '',
          client_secret: SENTINEL_CLIENT_SECRET || '',
          grant_type: 'client_credentials'
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Sentinel Hub token error:', errorText);
        throw new Error(`Sentinel Hub OAuth failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();
      return NextResponse.json(tokenData);
    }

    // Handle process API request
    if (action === 'process') {
      const { token, requestBody } = body;

      const processResponse = await fetch('https://services.sentinel-hub.com/api/v1/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error('Sentinel Hub process error:', errorText);
        throw new Error(`Sentinel Hub process failed: ${processResponse.status}`);
      }

      const processData = await processResponse.json();
      return NextResponse.json(processData);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Sentinel Hub Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy Sentinel Hub request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

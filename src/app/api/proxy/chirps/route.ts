import { NextRequest, NextResponse } from 'next/server';

const CHIRPS_API_URL = 'https://climateserv.servirglobal.net/api/';

// Also support GET for direct access
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  if (!action) {
    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  }

  try {
    let url = '';

    switch (action) {
      case 'getDataRequestProgress':
        if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        url = `${CHIRPS_API_URL}getDataRequestProgress/?id=${id}`;
        break;
      case 'getDataFromRequest':
        if (!id) return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
        url = `${CHIRPS_API_URL}getDataFromRequest/?id=${id}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action for GET' }, { status: 400 });
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`CHIRPS API GET returned status ${response.status}`);
      return NextResponse.json(
        { error: `CHIRPS API error: ${response.status}`, available: false },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('CHIRPS GET Proxy Error:', error.message);
    return NextResponse.json(
      { error: 'CHIRPS API unavailable', available: false },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    if (!data && action !== 'submitDataRequest') {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    let url = '';
    let method = 'POST';

    switch (action) {
      case 'submitDataRequest':
        url = `${CHIRPS_API_URL}submitDataRequest/`;
        break;
      case 'getDataRequestProgress':
        url = `${CHIRPS_API_URL}getDataRequestProgress/?id=${data.id}`;
        method = 'GET';
        break;
      case 'getDataFromRequest':
        url = `${CHIRPS_API_URL}getDataFromRequest/?id=${data.id}`;
        method = 'GET';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    console.log(`[CHIRPS Proxy] Action: ${action}, Method: ${method}, URL: ${url}`);
    if (method === 'POST' && data) {
      console.log(`[CHIRPS Proxy] Request body:`, JSON.stringify(data, null, 2));
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(30000), // Increased to 30 second timeout
    });

    console.log(`[CHIRPS Proxy] Response status: ${response.status}`);

    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CHIRPS API Error] Status ${response.status}:`, errorText.substring(0, 500));
      return NextResponse.json(
        {
          error: `CHIRPS API error: ${response.status}`,
          details: errorText.substring(0, 200),
          available: false
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');

    // Check if response is JSON
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('CHIRPS API returned non-JSON response:', text.substring(0, 200));

      // CHIRPS API might be down, return null to let AI tools handle gracefully
      return NextResponse.json({
        error: 'CHIRPS API unavailable',
        available: false
      }, { status: 503 });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('CHIRPS Proxy Error:', error.message);

    // Return specific error for timeout
    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'CHIRPS API timeout', available: false },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'CHIRPS API unavailable', available: false },
      { status: 503 }
    );
  }
}

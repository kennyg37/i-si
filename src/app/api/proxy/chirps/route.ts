import { NextRequest, NextResponse } from 'next/server';

const CHIRPS_API_URL = 'https://climateserv.servirglobal.net/api/';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, data } = body;

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

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    // Check response status
    if (!response.ok) {
      console.error(`CHIRPS API returned status ${response.status}`);
      return NextResponse.json(
        { error: `CHIRPS API error: ${response.status}` },
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

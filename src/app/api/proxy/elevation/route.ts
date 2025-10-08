import { NextRequest, NextResponse } from 'next/server';

const ELEVATION_API_URL = 'https://api.open-elevation.com/api/v1/lookup';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(ELEVATION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Elevation API returned ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Elevation Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elevation data' },
      { status: 500 }
    );
  }
}

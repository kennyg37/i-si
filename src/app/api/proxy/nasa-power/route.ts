import { NextRequest, NextResponse } from 'next/server';

const NASA_POWER_API_URL = 'https://power.larc.nasa.gov/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const endpoint = searchParams.get('endpoint') || 'temporal/daily/point';
    const parameters = searchParams.get('parameters') || '';
    const latitude = searchParams.get('latitude') || '';
    const longitude = searchParams.get('longitude') || '';
    const start = searchParams.get('start') || '';
    const end = searchParams.get('end') || '';
    const community = searchParams.get('community') || 'RE';

    if (!parameters || !latitude || !longitude || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const url = `${NASA_POWER_API_URL}/${endpoint}?parameters=${parameters}&community=${community}&longitude=${longitude}&latitude=${latitude}&start=${start}&end=${end}&format=json`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NASA POWER API returned ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('NASA POWER Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NASA POWER data' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://korven-api-56885c34702b.herokuapp.com/external/products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.KORVEN_API_TOKEN}`,
      }
    });

    if (!response.ok) {
      console.error(`Korven API returned status ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch Korven products: ${response.status}` },
        { status: response.status }
      );
    }

    const products = await response.json();
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching Korven products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Korven products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

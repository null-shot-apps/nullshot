import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Contract address is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch from DexScreener API for real-time DEX data
    const dexResponse = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { next: { revalidate: 30 } }
    );

    if (!dexResponse.ok) {
      throw new Error('Failed to fetch from DexScreener');
    }

    const dexData = await dexResponse.json();
    
    // Get the first pair (usually the most liquid)
    const pair = dexData.pairs?.[0];
    
    if (!pair) {
      // Fallback: Fetch token info from Snowtrace API
      const snowtraceResponse = await fetch(
        `https://api.snowtrace.io/api?module=token&action=tokeninfo&contractaddress=${address}`
      );
      
      const snowtraceData = await snowtraceResponse.json();
      
      if (snowtraceData.status === '1' && snowtraceData.result) {
        const tokenInfo = snowtraceData.result[0];
        return NextResponse.json({
          name: tokenInfo.name || 'Unknown',
          symbol: tokenInfo.symbol || 'N/A',
          price: 0,
          price_change_24h: 0,
          market_cap: 0,
          volume_24h: 0,
          circulating_supply: parseInt(tokenInfo.circulatingSupply || '0') / Math.pow(10, parseInt(tokenInfo.divisor || '18')),
          total_supply: parseInt(tokenInfo.totalSupply || '0') / Math.pow(10, parseInt(tokenInfo.divisor || '18')),
          last_updated: new Date().toISOString(),
        });
      }
      
      throw new Error('No trading pairs found');
    }

    return NextResponse.json({
      name: pair.baseToken.name,
      symbol: pair.baseToken.symbol,
      price: parseFloat(pair.priceUsd || '0'),
      price_change_24h: parseFloat(pair.priceChange?.h24 || '0'),
      market_cap: parseFloat(pair.marketCap || '0'),
      volume_24h: parseFloat(pair.volume?.h24 || '0'),
      circulating_supply: parseFloat(pair.baseToken.circulatingSupply || '0'),
      total_supply: parseFloat(pair.baseToken.totalSupply || '0'),
      last_updated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
}



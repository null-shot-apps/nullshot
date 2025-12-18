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
    // Try CoinGecko API first (free, no API key needed)
    try {
      const geckoResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/avalanche-2/contract/${address}`,
        { next: { revalidate: 30 } }
      );

      if (geckoResponse.ok) {
        const geckoData = await geckoResponse.json();
        return NextResponse.json({
          name: geckoData.name || 'Unknown',
          symbol: geckoData.symbol?.toUpperCase() || 'N/A',
          price: geckoData.market_data?.current_price?.usd || 0,
          price_change_24h: geckoData.market_data?.price_change_percentage_24h || 0,
          market_cap: geckoData.market_data?.market_cap?.usd || 0,
          volume_24h: geckoData.market_data?.total_volume?.usd || 0,
          circulating_supply: geckoData.market_data?.circulating_supply || 0,
          total_supply: geckoData.market_data?.total_supply || 0,
          last_updated: geckoData.last_updated || new Date().toISOString(),
        });
      }
    } catch {
      // Continue to DexScreener fallback
    }

    // Fallback to DexScreener API
    const dexResponse = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { next: { revalidate: 30 } }
    );

    if (!dexResponse.ok) {
      throw new Error('Failed to fetch from DexScreener');
    }

    const dexData = await dexResponse.json();
    const pair = dexData.pairs?.[0];
    
    if (!pair) {
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




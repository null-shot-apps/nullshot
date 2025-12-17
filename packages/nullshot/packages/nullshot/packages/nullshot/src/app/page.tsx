'use client';

import { useEffect, useState } from 'react';

const XAVALABS_ADDRESS = '0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4';

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
  total_supply: number;
  last_updated: string;
}

export default function TokenTracker() {
  const [contractAddress, setContractAddress] = useState(XAVALABS_ADDRESS);
  const [inputAddress, setInputAddress] = useState('');
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTokenData = async (address: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Using DexScreener API - free, no API key required
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }
      
      const data = await response.json() as { pairs?: any[] };
      
      if (!data.pairs || data.pairs.length === 0) {
        throw new Error('No trading pairs found for this token');
      }
      
      // Get the most liquid pair (highest liquidity)
      const mainPair = data.pairs.reduce((prev: any, current: any) => 
        (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
      );
      
      setTokenData({
        name: mainPair.baseToken.name,
        symbol: mainPair.baseToken.symbol,
        price: parseFloat(mainPair.priceUsd || '0'),
        price_change_24h: parseFloat(mainPair.priceChange?.h24 || '0'),
        market_cap: parseFloat(mainPair.fdv || '0'),
        volume_24h: parseFloat(mainPair.volume?.h24 || '0'),
        circulating_supply: 0, // DexScreener doesn't provide this
        total_supply: 0, // DexScreener doesn't provide this
        last_updated: new Date().toISOString()
      });
    } catch {
      setError('Unable to fetch token data. Please check the contract address.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData(contractAddress);
    const interval = setInterval(() => {
      fetchTokenData(contractAddress);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [contractAddress]);

  const handleTrackToken = () => {
    if (inputAddress.trim()) {
      setContractAddress(inputAddress.trim());
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return `${num.toFixed(2)}`;
  };

  const formatSupply = (num: number) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Xavalabs Token Tracker
          </h1>
          <p className="text-gray-400">Live cryptocurrency data from DexScreener</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Track Any Token by Contract Address
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Paste contract address (e.g., 0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4)"
              className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && handleTrackToken()}
            />
            <button
              onClick={handleTrackToken}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Track
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Current: {contractAddress}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Fetching live data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Token Data Display */}
        {tokenData && !loading && (
          <div className="space-y-6">
            {/* Main Stats Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold">{tokenData.name}</h2>
                  <p className="text-gray-400 text-lg">{tokenData.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">${tokenData.price.toFixed(6)}</p>
                  <p className={`text-lg font-semibold ${tokenData.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tokenData.price_change_24h >= 0 ? '↑' : '↓'} {Math.abs(tokenData.price_change_24h).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Market Cap</p>
                  <p className="text-xl font-bold">{formatNumber(tokenData.market_cap)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">24h Volume</p>
                  <p className="text-xl font-bold">{formatNumber(tokenData.volume_24h)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">FDV</p>
                  <p className="text-xl font-bold">${formatNumber(tokenData.market_cap)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Liquidity</p>
                  <p className="text-xl font-bold">Live</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-400">
                  Last updated: {new Date(tokenData.last_updated).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <p className="font-semibold">View on Explorer</p>
              </button>
              <button className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <p className="font-semibold">Add to Watchlist</p>
              </button>
              <button className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                <p className="font-semibold">Share</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






import type { DbzCard, PricePoint, Range } from "./types";

/** Deterministic string -> 32bit seed */
function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/** mulberry32 PRNG -> returns fn producing floats in [0,1) */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via Box-Muller */
function randn(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  const v = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Rarity -> volatility multiplier (higher = wilder swings, like chase cards) */
const RARITY_VOLATILITY: Record<string, number> = {
  "God Rare": 1.7,
  "Secret Rare": 1.4,
  "Special Leader Rare": 1.35,
  "Special Rare": 1.15,
  "Concept Rare": 1.15,
  "Iconic Attack Rare": 1.15,
  "Duo Power Rare": 1.15,
  "Dragon Ball Rare": 1.1,
  "Expansion Rare": 1.1,
  "Super Rare": 1.0,
  Rare: 0.9,
  Uncommon: 0.8,
  Common: 0.7,
};

export function rarityVolatility(rarity: string): number {
  return RARITY_VOLATILITY[rarity] ?? 1;
}

const RANGE_CONFIG: Record<Range, { points: number; spanMs: number; baseSigma: number }> = {
  "1D": { points: 48, spanMs: 24 * 60 * 60 * 1000, baseSigma: 0.018 },
  "1W": { points: 56, spanMs: 7 * 24 * 60 * 60 * 1000, baseSigma: 0.045 },
  "1M": { points: 30, spanMs: 30 * 24 * 60 * 60 * 1000, baseSigma: 0.09 },
  "3M": { points: 60, spanMs: 90 * 24 * 60 * 60 * 1000, baseSigma: 0.16 },
  "1Y": { points: 52, spanMs: 365 * 24 * 60 * 60 * 1000, baseSigma: 0.32 },
};

/**
 * Deterministic mock OHLC-ish price history anchored so the final point
 * equals the card's real (API-sourced) market price.
 */
export function generateHistory(card: DbzCard, range: Range): PricePoint[] {
  const cfg = RANGE_CONFIG[range];
  const seed = hashSeed(`${card.id}-${range}`);
  const rand = mulberry32(seed);
  const vol = rarityVolatility(card.rarity);
  const sigma = (cfg.baseSigma * vol) / Math.sqrt(cfg.points);

  // seeded sinusoidal trend so charts look like real market structure
  const trendAmp = (0.4 + rand() * 0.9) * cfg.baseSigma * vol;
  const trendFreq = 0.6 + rand() * 2.2;
  const trendPhase = rand() * Math.PI * 2;
  const driftBias = (rand() - 0.45) * sigma * 0.6;

  const logPath: number[] = [0];
  for (let i = 1; i < cfg.points; i++) {
    const noise = randn(rand) * sigma;
    const trend =
      (trendAmp * Math.sin(trendPhase + (i / cfg.points) * Math.PI * 2 * trendFreq)) /
      cfg.points;
    logPath.push(logPath[i - 1] + noise + driftBias + trend);
  }

  const anchor = logPath[cfg.points - 1];
  const now = Date.now();
  const start = now - cfg.spanMs;

  return logPath.map((logVal, i) => ({
    time: start + (cfg.spanMs * i) / (cfg.points - 1),
    price: Math.max(0.01, card.price * Math.exp(logVal - anchor)),
  }));
}

/** Deterministic seeded 24h change percentage (used as a stable baseline). */
export function seededChange24h(card: DbzCard): number {
  const rand = mulberry32(hashSeed(`${card.id}-change24h`));
  const vol = rarityVolatility(card.rarity);
  // Skew slightly positive, range roughly -10% .. +16%
  return (rand() - 0.42) * 14 * vol;
}

/** Deterministic 24h high/low band around the current price. */
export function seeded24hRange(card: DbzCard, currentPrice: number) {
  const rand = mulberry32(hashSeed(`${card.id}-hilo`));
  const spread = (0.02 + rand() * 0.05) * rarityVolatility(card.rarity);
  return {
    high: currentPrice * (1 + spread * (0.5 + rand())),
    low: currentPrice * (1 - spread * (0.5 + rand())),
  };
}

interface MarketStats {
  openInterestLong: number;
  openInterestShort: number;
  totalVolume: number;
  listings: number;
  recentSales: number;
  utilization: number;
}

/** Deterministic flavor stats for the market detail page. */
export function seededMarketStats(card: DbzCard): MarketStats {
  const rand = mulberry32(hashSeed(`${card.id}-stats`));
  const base = card.price * (50 + rand() * 950);
  const long = base * (0.3 + rand() * 0.7);
  const short = base * (0.3 + rand() * 0.7);
  return {
    openInterestLong: long,
    openInterestShort: short,
    totalVolume: (long + short) * (1.5 + rand() * 6),
    listings: Math.floor(10 + rand() * 240),
    recentSales: Math.floor(1 + rand() * 12),
    utilization: Math.min(98, (long + short) / (card.price * 1000) * 100),
  };
}

/** Small random-walk step, used for the realtime ticker (and hourly mock refresh with a larger sigma). */
export function liveStep(price: number, rarity: string, rand: () => number, sigma?: number): number {
  const vol = rarityVolatility(rarity);
  const s = sigma ?? 0.0015 * vol;
  const change = randn(rand) * s;
  return Math.max(0.01, price * (1 + change));
}

export function makeRand(seed: string): () => number {
  return mulberry32(hashSeed(seed));
}

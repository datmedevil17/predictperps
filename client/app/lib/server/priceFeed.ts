import { DBZ_CARDS } from "@/app/lib/cards";
import { liveStep, rarityVolatility, seededChange24h } from "@/app/lib/mock";

const TICK_MS = 2500;
const HOURLY_MS = 60 * 60 * 1000;
// Larger sigma than the fast ticker so the hourly mock refresh feels like a real market move.
const HOURLY_SIGMA = 0.02;

interface PriceFeedState {
  prices: Record<string, number>;
  baseline: Record<string, number>;
  updatedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __priceFeed:
    | {
        state: PriceFeedState;
        fastTimer: ReturnType<typeof setInterval>;
        hourlyTimer: ReturnType<typeof setInterval>;
      }
    | undefined;
}

function createState(): PriceFeedState {
  const prices: Record<string, number> = {};
  const baseline: Record<string, number> = {};
  for (const card of DBZ_CARDS) {
    prices[card.slug] = card.price;
    const change24h = card.change24h ?? seededChange24h(card);
    baseline[card.slug] = card.price / (1 + change24h / 100);
  }
  return { prices, baseline, updatedAt: Date.now() };
}

function tick(state: PriceFeedState) {
  for (const card of DBZ_CARDS) {
    const current = state.prices[card.slug] ?? card.price;
    state.prices[card.slug] = liveStep(current, card.rarity, Math.random);
  }
  state.updatedAt = Date.now();
}

/** Mock hourly price refresh for all cards (bigger step than the realtime ticker). */
function hourlyTick(state: PriceFeedState) {
  for (const card of DBZ_CARDS) {
    const current = state.prices[card.slug] ?? card.price;
    const sigma = HOURLY_SIGMA * rarityVolatility(card.rarity);
    state.prices[card.slug] = liveStep(current, card.rarity, Math.random, sigma);
  }
  state.updatedAt = Date.now();
}

function getFeed() {
  if (!globalThis.__priceFeed) {
    const state = createState();
    const fastTimer = setInterval(() => tick(state), TICK_MS);
    const hourlyTimer = setInterval(() => hourlyTick(state), HOURLY_MS);
    globalThis.__priceFeed = { state, fastTimer, hourlyTimer };
  }
  return globalThis.__priceFeed.state;
}

/** Snapshot of the server's live price feed (in-memory, "no oracle" simple feed). */
export function getPriceSnapshot(): PriceFeedState {
  const state = getFeed();
  return {
    prices: { ...state.prices },
    baseline: { ...state.baseline },
    updatedAt: state.updatedAt,
  };
}

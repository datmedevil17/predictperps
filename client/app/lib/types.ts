export interface DbzCard {
  id: number;
  slug: string;
  name: string;
  character: string;
  set: string;
  rarity: string;
  number: string;
  price: number;
  image: string;
  tcgplayerId: number;
  printing: string;
  /** Real TCGplayer data, present only for cards refreshed via /v1/cards/:id/prices */
  lowPrice?: number;
  medianPrice?: number;
  priceUpdatedAt?: string;
  change24h?: number;
  change7d?: number;
  change30d?: number;
}

export type Range = "1D" | "1W" | "1M" | "3M" | "1Y";

export interface PricePoint {
  time: number;
  price: number;
}

export type Side = "long" | "short";

export interface Position {
  id: string;
  cardSlug: string;
  side: Side;
  size: number;
  margin: number;
  leverage: number;
  entryPrice: number;
  openedAt: number;
  isActive?: boolean;
}

export interface ClosedTrade {
  id: string;
  cardSlug: string;
  side: Side;
  size: number;
  margin: number;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  openedAt: number;
  isActive?: boolean;
  closedAt: number;
}

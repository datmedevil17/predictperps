import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClosedTrade, DbzCard, Position, Side } from "./types";
import {
  STARTING_BALANCE,
  calcFee,
  calcMargin,
  calcPnl,
  MIN_POSITION_SIZE,
} from "./trading";

interface OpenResult {
  ok: boolean;
  error?: string;
}

interface PerpsState {
  balance: number;
  positions: Position[];
  closedTrades: ClosedTrade[];
  livePrices: Record<string, number>;
  baselinePrices: Record<string, number>;

  setPrices: (prices: Record<string, number>, baseline: Record<string, number>) => void;
  markPrice: (card: DbzCard) => number;
  change24h: (card: DbzCard) => number;

  openPosition: (
    card: DbzCard,
    side: Side,
    size: number,
    leverage: number
  ) => OpenResult;
  closePosition: (id: string, markPrice: number) => void;
  addMargin: (id: string, amount: number) => OpenResult;
  resetAccount: () => void;
}

export const usePerpsStore = create<PerpsState>()(
  persist(
    (set, get) => ({
      balance: STARTING_BALANCE,
      positions: [],
      closedTrades: [],
      livePrices: {},
      baselinePrices: {},

      setPrices: (prices, baseline) => {
        set({ livePrices: prices, baselinePrices: baseline });
      },

      markPrice: (card) => {
        return get().livePrices[card.slug] ?? card.price;
      },

      change24h: (card) => {
        const live = get().livePrices[card.slug] ?? card.price;
        const base = get().baselinePrices[card.slug] ?? card.price;
        if (base === 0) return 0;
        return ((live - base) / base) * 100;
      },

      openPosition: (card, side, size, leverage) => {
        const { balance } = get();
        if (size < MIN_POSITION_SIZE) {
          return { ok: false, error: `Minimum position size is $${MIN_POSITION_SIZE}` };
        }
        const margin = calcMargin(size, leverage);
        const fee = calcFee(size);
        if (margin + fee > balance) {
          return { ok: false, error: "Insufficient balance" };
        }
        const entryPrice = get().markPrice(card);
        const position: Position = {
          id: `${card.slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          cardSlug: card.slug,
          side,
          size,
          margin,
          leverage,
          entryPrice,
          openedAt: Date.now(),
        };
        set({
          balance: balance - margin - fee,
          positions: [...get().positions, position],
        });
        return { ok: true };
      },

      closePosition: (id, markPrice) => {
        const { positions, balance, closedTrades } = get();
        const position = positions.find((p) => p.id === id);
        if (!position) return;
        const pnl = calcPnl(position, markPrice);
        const fee = calcFee(position.size);
        const closed: ClosedTrade = {
          id: position.id,
          cardSlug: position.cardSlug,
          side: position.side,
          size: position.size,
          margin: position.margin,
          leverage: position.leverage,
          entryPrice: position.entryPrice,
          exitPrice: markPrice,
          pnl,
          openedAt: position.openedAt,
          closedAt: Date.now(),
        };
        set({
          balance: balance + position.margin + pnl - fee,
          positions: positions.filter((p) => p.id !== id),
          closedTrades: [closed, ...closedTrades].slice(0, 50),
        });
      },

      addMargin: (id, amount) => {
        const { positions, balance } = get();
        const position = positions.find((p) => p.id === id);
        if (!position) return { ok: false, error: "Position not found" };
        if (amount <= 0 || amount > balance) {
          return { ok: false, error: "Insufficient balance" };
        }
        set({
          balance: balance - amount,
          positions: positions.map((p) =>
            p.id === id
              ? {
                  ...p,
                  margin: p.margin + amount,
                  leverage: p.size / (p.margin + amount),
                }
              : p
          ),
        });
        return { ok: true };
      },

      resetAccount: () => {
        set({
          balance: STARTING_BALANCE,
          positions: [],
          closedTrades: [],
        });
      },
    }),
    {
      name: "dbz-perps-store",
      partialize: (state) => ({
        balance: state.balance,
        positions: state.positions,
        closedTrades: state.closedTrades,
      }),
    }
  )
);

import type { Position, Side } from "./types";

export const FEE_RATE = 0.001; // 0.1% taker fee
export const MAINTENANCE_MARGIN_RATIO = 0.01; // 1%
export const MAX_LEVERAGE = 50;
export const MIN_POSITION_SIZE = 0.01;
export const STARTING_BALANCE = 1000;

export function calcMargin(size: number, leverage: number): number {
  return size / leverage;
}

export function calcFee(size: number): number {
  return size * FEE_RATE;
}

export function calcLiquidationPrice(
  entryPrice: number,
  leverage: number,
  side: Side
): number {
  const move = 1 / leverage - MAINTENANCE_MARGIN_RATIO;
  if (side === "long") {
    return Math.max(0, entryPrice * (1 - move));
  }
  return entryPrice * (1 + move);
}

export function calcPnl(position: Position, markPrice: number): number {
  const diff =
    position.side === "long"
      ? markPrice - position.entryPrice
      : position.entryPrice - markPrice;
  return (diff / position.entryPrice) * position.size;
}

export function calcRoi(pnl: number, margin: number): number {
  if (margin === 0) return 0;
  return (pnl / margin) * 100;
}

export function isLiquidated(position: Position, markPrice: number): boolean {
  const liq = calcLiquidationPrice(position.entryPrice, position.leverage, position.side);
  return position.side === "long" ? markPrice <= liq : markPrice >= liq;
}

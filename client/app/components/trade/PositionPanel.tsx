"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DbzCard, Position } from "@/app/lib/types";
import { usePerpsStore } from "@/app/lib/store";
import { formatUSD, formatSOL } from "@/app/lib/format";
import { PriceChange } from "@/app/components/ui/PriceChange";
import { useProgram, derivePositionPda } from "@/app/lib/useProgram";
import { useStandardWallet } from "@/app/lib/useStandardWallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  calcLiquidationPrice,
  calcPnl,
  calcRoi,
} from "@/app/lib/trading";

export function PositionPanel({ card, position }: { card: DbzCard; position: Position }) {
  const markPrice = usePerpsStore((s) => s.markPrice(card));
  const balance = usePerpsStore((s) => s.balance); // Kept for reference but we could use Privy

  const { publicKey } = useStandardWallet();
  const { closePosition, revealPosition, settleFunds } = useProgram();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pnl = calcPnl(position, markPrice);
  const roi = calcRoi(pnl, position.margin);
  const liqPrice = calcLiquidationPrice(position.entryPrice, position.leverage, position.side);
  const equity = position.margin + pnl;

  const handleClose = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      if (!publicKey) throw new Error("Wallet not connected");
      const pda = derivePositionPda(card.id, publicKey);
      const priceScaled = Math.floor(markPrice * 1e6);
      const sig = await closePosition(pda, priceScaled);
      if (!sig) throw new Error("Failed to close position on Rollup");
      setSuccess("Position closed on Rollup!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettle = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      if (!publicKey) throw new Error("Wallet not connected");
      const pda = derivePositionPda(card.id, publicKey);
      
      setSuccess("Revealing state to base layer...");
      await revealPosition(card.id);
      
      setSuccess("Settling funds...");
      await settleFunds(pda);
      
      setSuccess("Funds settled successfully!");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-black/40 p-5 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-widest shadow-inner ${
              position.side === "long"
                ? "bg-long/10 text-long ring-1 ring-inset ring-long/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                : "bg-short/10 text-short ring-1 ring-inset ring-short/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
            }`}
          >
            {position.side} &middot; {position.leverage}x
          </span>
          <span className="font-mono text-[10px] text-zinc-500">
            {new Date(position.openedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* PNL Box */}
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
        <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Unrealized PnL</p>
        <p
          className={`relative z-10 mt-1 font-mono text-3xl font-black tracking-tight ${
            pnl >= 0 ? "text-long drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]" : "text-short drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]"
          }`}
        >
          {pnl >= 0 ? "+" : ""}
          {formatSOL(pnl)}
        </p>
        <div className="relative z-10 mt-1 flex justify-center">
          <PriceChange value={roi} className="text-xs font-bold" showIcon />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Position Size</span>
          <span className="font-mono font-medium text-zinc-200">{formatSOL(position.size)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Margin</span>
          <span className="font-mono font-medium text-zinc-200">{formatSOL(position.margin)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Entry Price</span>
          <span className="font-mono font-medium text-zinc-200">{formatUSD(position.entryPrice)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Mark Price</span>
          <span className="font-mono font-medium text-zinc-200">{formatUSD(markPrice)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Liq. Price</span>
          <span className="font-mono font-bold text-accent-2 drop-shadow-[0_0_6px_rgba(255,51,102,0.5)]">
            {formatUSD(liqPrice)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Equity</span>
          <span className="font-mono font-medium text-zinc-200">{formatSOL(Math.max(0, equity))}</span>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="rounded-lg border border-short/20 bg-short/10 px-3 py-2 text-[11px] font-semibold text-short shadow-inner"
          >
            {error}
          </motion.p>
        )}
        {success && !error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="rounded-lg border border-long/20 bg-long/10 px-3 py-2 text-[11px] font-semibold text-long shadow-inner"
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {position.isActive === false ? (
        <button
          onClick={handleSettle}
          disabled={isSubmitting}
          className="group relative overflow-hidden rounded-xl border border-long/30 bg-long/10 py-3.5 text-xs font-black uppercase tracking-widest text-long transition-all hover:border-long/60 hover:bg-long/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="relative z-10 transition-transform group-hover:scale-105">
            {isSubmitting ? "Processing..." : "Settle Funds (L1)"}
          </span>
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-long/10 to-transparent opacity-0 transition-opacity group-hover:animate-[shimmer_2s_infinite] group-hover:opacity-100" />
        </button>
      ) : (
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="group relative overflow-hidden rounded-xl border border-short/30 bg-short/10 py-3.5 text-xs font-black uppercase tracking-widest text-short transition-all hover:border-short/60 hover:bg-short/20 hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          <span className="relative z-10 transition-transform group-hover:scale-105">
            {isSubmitting ? "Closing..." : "Close Position"}
          </span>
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-short/10 to-transparent opacity-0 transition-opacity group-hover:animate-[shimmer_2s_infinite] group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}

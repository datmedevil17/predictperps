"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DbzCard, Side } from "@/app/lib/types";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { formatUSD, formatSOL } from "@/app/lib/format";
import {
  MAX_LEVERAGE,
  MIN_POSITION_SIZE,
  calcFee,
  calcLiquidationPrice,
  calcMargin,
} from "@/app/lib/trading";
import { useProgram } from "@/app/lib/useProgram";
import { useStandardWallet } from "@/app/lib/useStandardWallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const PERCENT_PRESETS = [25, 50, 75, 100];

export function OrderPanel({ card }: { card: DbzCard }) {
  const mounted = useMounted();
  const { balance: privyBalance } = useStandardWallet();
  const balance = privyBalance ?? 0;
  
  const markPrice = usePerpsStore((s) => s.markPrice(card));
  
  const { openPosition, delegatePosition, initEphemeralConnection } = useProgram();

  const [side, setSide] = useState<Side>("long");
  const [size, setSize] = useState("0.01");
  const [leverage, setLeverage] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeNum = Number(size) || 0;

  const margin = useMemo(() => calcMargin(sizeNum, leverage), [sizeNum, leverage]);
  const fee = useMemo(() => calcFee(sizeNum), [sizeNum]);
  const liqPrice = useMemo(
    () => calcLiquidationPrice(markPrice, leverage, side),
    [markPrice, leverage, side]
  );

  const maxSize = useMemo(() => Math.max(0, (balance - fee) * leverage), [balance, leverage, fee]);

  const applyPercent = (pct: number) => {
    const raw = (balance * leverage * pct) / 100;
    const adjusted = pct === 100 ? raw / (1 + 0.0011) : raw;
    setSize(adjusted > 0 ? adjusted.toFixed(2) : "0");
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    
    try {
      // Scale numbers for the contract (which expects u64 integers)
      const collateralLamports = Math.floor(margin * LAMPORTS_PER_SOL);
      const priceScaled = Math.floor(markPrice * 1e6);
      
      // 1. Open Position (L1)
      const txSig = await openPosition(card.id, side === "long", collateralLamports, leverage, priceScaled);
      if (!txSig) {
        setError("Failed to open position. Please check your wallet.");
        setIsSubmitting(false);
        return;
      }
      
      setSuccess("Position opened! Connecting to TEE...");
      
      // 2. Initialize TEE Connection
      await initEphemeralConnection();
      
      setSuccess("Delegating to Rollup...");
      
      // 3. Delegate to Rollup
      const delSig = await delegatePosition(card.id);
      if (!delSig) {
        setError("Failed to delegate position to TEE.");
        setIsSubmitting(false);
        return;
      }
      
      // Update the local mock state so the position shows up in the UI
      usePerpsStore.setState((state) => ({
        positions: [
          ...state.positions,
          {
            id: `${card.slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            cardSlug: card.slug,
            side: side,
            size: sizeNum,
            margin: margin,
            leverage: leverage,
            entryPrice: markPrice,
            openedAt: Date.now(),
          },
        ],
      }));

      setSuccess(`${side === "long" ? "Long" : "Short"} position active in TEE!`);
      setSize("0.01");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const insufficientBalance = mounted && margin + fee > balance;
  const belowMin = sizeNum > 0 && sizeNum < MIN_POSITION_SIZE;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/40 p-4 shadow-2xl backdrop-blur-xl">
      {/* Side Toggle */}
      <div className="relative flex rounded-xl bg-surface-2/50 p-1 ring-1 ring-inset ring-white/5">
        <button
          onClick={() => setSide("long")}
          className={`relative z-10 flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
            side === "long" ? "text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSide("short")}
          className={`relative z-10 flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
            side === "short" ? "text-black" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Short
        </button>
        <motion.div
          className={`absolute inset-1 rounded-lg ${
            side === "long"
              ? "bg-long shadow-[0_0_12px_rgba(34,197,94,0.4)]"
              : "bg-short shadow-[0_0_12px_rgba(239,68,68,0.4)]"
          }`}
          initial={false}
          animate={{ x: side === "long" ? "0%" : "100%", width: "calc(50% - 4px)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>

      {/* Position Size Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
          <span>Size (SOL)</span>
          <span>
            Balance: <span className="font-mono text-zinc-200">{mounted ? formatSOL(balance) : "—"}</span>
          </span>
        </div>
        
        <div className="group relative flex items-center rounded-xl border border-white/10 bg-white/5 transition-all focus-within:border-accent/60 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-accent/20">
          <span className="pointer-events-none absolute left-3 text-zinc-500 font-bold text-xs transition-colors group-focus-within:text-accent">
            SOL
          </span>
          <input
            value={size}
            onChange={(e) => setSize(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            className="w-full bg-transparent py-2.5 pl-10 pr-3 text-right font-mono text-lg text-white shadow-inner focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {PERCENT_PRESETS.map((pct) => (
              <button
                key={pct}
                onClick={() => applyPercent(pct)}
                className="rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-zinc-400 transition-all hover:bg-white/10 hover:text-white active:scale-95"
              >
                {pct === 100 ? "MAX" : `${pct}%`}
              </button>
            ))}
          </div>
          {mounted && (
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">
              Max: <span className="font-mono text-zinc-300">{formatSOL(maxSize, { compact: true })}</span>
            </span>
          )}
        </div>
      </div>

      {/* Leverage Slider */}
      <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">Leverage <span className="text-zinc-600 lowercase">(1x - {MAX_LEVERAGE}x)</span></span>
          <span className="font-mono text-sm font-bold text-accent">{leverage}x</span>
        </div>
        <div className="relative flex h-5 items-center">
          <input
            type="range"
            min={1}
            max={MAX_LEVERAGE}
            step={1}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full cursor-pointer appearance-none rounded-full bg-surface-2/80 h-1 outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,106,26,0.8)] [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110"
          />
        </div>
      </div>

      {/* Order Details */}
      <div className="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] font-medium text-zinc-400">
        <div className="flex justify-between items-center">
          <span>Entry Price</span>
          <span className="font-mono text-zinc-100">{formatUSD(markPrice)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Required Margin</span>
          <span className="font-mono text-zinc-100">{formatSOL(margin)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Fees (0.1%)</span>
          <span className="font-mono text-zinc-100">{formatSOL(fee)}</span>
        </div>
        <div className="mt-1 flex justify-between items-center border-t border-white/5 pt-2">
          <span>Liquidation Price</span>
          <span className="font-mono font-bold text-accent-2 drop-shadow-[0_0_6px_rgba(255,51,102,0.4)]">
            {formatUSD(liqPrice)}
          </span>
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

      {/* Submit Button */}
      <div className="mt-1 flex flex-col gap-1.5">
        <button
          onClick={handleSubmit}
          disabled={!mounted || sizeNum <= 0 || belowMin || insufficientBalance || isSubmitting}
          className={`group relative overflow-hidden rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 ${
            side === "long"
              ? "bg-long text-black shadow-[0_0_16px_rgba(34,197,94,0.3)] hover:shadow-[0_0_24px_rgba(34,197,94,0.5)]"
              : "bg-short text-white shadow-[0_0_16px_rgba(239,68,68,0.3)] hover:shadow-[0_0_24px_rgba(239,68,68,0.5)]"
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
            {isSubmitting ? "Processing..." : (side === "long" ? "Open Long" : "Open Short")}
          </span>
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </button>

        <AnimatePresence>
          {belowMin && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center text-[10px] font-medium text-short mt-1"
            >
              Minimum position size is {formatSOL(MIN_POSITION_SIZE)}
            </motion.p>
          )}
          {insufficientBalance && !belowMin && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center text-[10px] font-medium text-short mt-1"
            >
              Insufficient balance for margin + fees
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

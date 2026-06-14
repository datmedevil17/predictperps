"use client";

import { useState } from "react";
import type { DbzCard } from "@/app/lib/types";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { formatUSD, formatCompact } from "@/app/lib/format";
import { seededMarketStats } from "@/app/lib/mock";
import { calcLiquidationPrice, calcPnl, calcRoi } from "@/app/lib/trading";
import { PriceChange } from "@/app/components/ui/PriceChange";

type Tab = "position" | "interest" | "info";

export function MarketTabsSection({ card }: { card: DbzCard }) {
  const [tab, setTab] = useState<Tab>("position");
  const mounted = useMounted();
  const positions = usePerpsStore((s) => s.positions);
  const markPrice = usePerpsStore((s) => s.markPrice(card));

  const position = positions.find((p) => p.cardSlug === card.slug);
  const stats = seededMarketStats(card);
  const totalOi = stats.openInterestLong + stats.openInterestShort;
  const longPct = totalOi === 0 ? 50 : (stats.openInterestLong / totalOi) * 100;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex border-b border-border text-sm font-medium">
        {(
          [
            ["position", "My Position"],
            ["interest", "Open Interest"],
            ["info", "Card Info"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 transition-colors ${
              tab === key
                ? "border-b-2 border-accent text-white"
                : "text-muted hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "position" && (
          <>
            {!mounted || !position ? (
              <div className="py-8 text-center text-sm text-muted">
                {mounted
                  ? "No open position for this market. Use the panel to open a long or short."
                  : "Loading..."}
              </div>
            ) : (
              <PositionSummaryRow position={position} markPrice={markPrice} />
            )}
          </>
        )}

        {tab === "interest" && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-long">
                  Long {formatUSD(stats.openInterestLong, { compact: true })}
                </span>
                <span className="font-semibold text-short">
                  Short {formatUSD(stats.openInterestShort, { compact: true })}
                </span>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-long" style={{ width: `${longPct}%` }} />
                <div className="h-full bg-short" style={{ width: `${100 - longPct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="24h Volume" value={formatUSD(stats.totalVolume, { compact: true })} />
              <Stat label="Active Listings" value={formatCompact(stats.listings)} />
              <Stat label="Recent Sales" value={formatCompact(stats.recentSales)} />
              <Stat label="Utilization" value={`${stats.utilization.toFixed(1)}%`} />
            </div>
          </div>
        )}

        {tab === "info" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Character" value={card.character} />
            <Stat label="Set" value={card.set} />
            <Stat label="Card Number" value={card.number} />
            <Stat label="Rarity" value={card.rarity} />
            <Stat label="Printing" value={card.printing} />
            <Stat label="TCGplayer ID" value={`#${card.tcgplayerId}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <span className="truncate font-mono text-sm text-zinc-100" title={value}>
        {value}
      </span>
    </div>
  );
}

function PositionSummaryRow({
  position,
  markPrice,
}: {
  position: import("@/app/lib/types").Position;
  markPrice: number;
}) {
  const pnl = calcPnl(position, markPrice);
  const roi = calcRoi(pnl, position.margin);
  const liq = calcLiquidationPrice(position.entryPrice, position.leverage, position.side);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
      <Stat
        label="Side"
        value={`${position.side === "long" ? "Long" : "Short"} ${position.leverage}x`}
      />
      <Stat label="Size" value={formatUSD(position.size)} />
      <Stat label="Margin" value={formatUSD(position.margin)} />
      <Stat label="Entry" value={formatUSD(position.entryPrice)} />
      <Stat label="Liq. Price" value={formatUSD(liq)} />
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3">
        <span className="text-[11px] uppercase tracking-wide text-muted">Unrealized PnL</span>
        <span className={`font-mono text-sm font-semibold ${pnl >= 0 ? "text-long" : "text-short"}`}>
          {pnl >= 0 ? "+" : ""}
          {formatUSD(pnl)}
        </span>
        <PriceChange value={roi} className="text-[11px]" />
      </div>
    </div>
  );
}

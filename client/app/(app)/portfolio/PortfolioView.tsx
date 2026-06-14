"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { getCardBySlug } from "@/app/lib/cards";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { formatUSD } from "@/app/lib/format";
import { calcLiquidationPrice, calcPnl, calcRoi } from "@/app/lib/trading";
import { CardImage } from "@/app/components/ui/CardImage";
import { RarityBadge } from "@/app/components/ui/RarityBadge";
import { PriceChange } from "@/app/components/ui/PriceChange";

export function PortfolioView() {
  const mounted = useMounted();
  const balance = usePerpsStore((s) => s.balance);
  const positions = usePerpsStore((s) => s.positions);
  const closedTrades = usePerpsStore((s) => s.closedTrades);
  const livePrices = usePerpsStore((s) => s.livePrices);
  const closePosition = usePerpsStore((s) => s.closePosition);

  const summary = useMemo(() => {
    let totalMargin = 0;
    let unrealizedPnl = 0;
    let totalExposure = 0;
    for (const p of positions) {
      const card = getCardBySlug(p.cardSlug);
      const mark = card ? livePrices[card.slug] ?? card.price : p.entryPrice;
      totalMargin += p.margin;
      totalExposure += p.size;
      unrealizedPnl += calcPnl(p, mark);
    }
    const realizedPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const equity = balance + totalMargin + unrealizedPnl;
    return { totalMargin, unrealizedPnl, totalExposure, realizedPnl, equity };
  }, [positions, closedTrades, balance, livePrices]);

  const stats = [
    { label: "Account Equity", value: formatUSD(summary.equity) },
    {
      label: "Unrealized P&L",
      value: `${summary.unrealizedPnl >= 0 ? "+" : ""}${formatUSD(summary.unrealizedPnl)}`,
      tone: summary.unrealizedPnl >= 0 ? "text-long" : "text-short",
    },
    { label: "Total Exposure", value: formatUSD(summary.totalExposure) },
    {
      label: "Realized P&L",
      value: `${summary.realizedPnl >= 0 ? "+" : ""}${formatUSD(summary.realizedPnl)}`,
      tone: summary.realizedPnl >= 0 ? "text-long" : "text-short",
    },
    { label: "Available Balance", value: formatUSD(balance) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-white sm:text-4xl">
            My <span className="text-accent">Portfolio</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your mock wallet, open positions, and trade history.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono text-zinc-300 sm:flex">
          <Wallet size={14} className="text-accent" />
          DBZx7...G0KU
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4">
            <span className="text-[11px] uppercase tracking-wide text-muted">{s.label}</span>
            <span className={`font-mono text-lg font-bold text-white ${mounted ? s.tone ?? "" : ""}`}>
              {mounted ? s.value : "—"}
            </span>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl tracking-wide text-white">
          Open Positions{mounted && positions.length > 0 ? ` (${positions.length})` : ""}
        </h2>
        {!mounted || positions.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface py-12 text-center text-muted">
            {mounted ? (
              <>
                <p>You don&apos;t have any open positions yet.</p>
                <Link
                  href="/markets"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  Browse markets <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              "Loading..."
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {positions.map((p) => {
              const card = getCardBySlug(p.cardSlug);
              if (!card) return null;
              const mark = livePrices[card.slug] ?? card.price;
              const pnl = calcPnl(p, mark);
              const roi = calcRoi(pnl, p.margin);
              const liq = calcLiquidationPrice(p.entryPrice, p.leverage, p.side);
              return (
                <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/trade/${card.slug}`}
                      className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-black"
                    >
                      <CardImage src={card.image} alt={card.name} sizes="48px" className="object-contain" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/trade/${card.slug}`}
                        className="line-clamp-1 text-sm font-semibold text-zinc-100 hover:text-accent"
                      >
                        {card.name}
                      </Link>
                      <div className="mt-1 flex items-center gap-2">
                        <RarityBadge rarity={card.rarity} />
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            p.side === "long" ? "bg-long/15 text-long" : "bg-short/15 text-short"
                          }`}
                        >
                          {p.side} {p.leverage}x
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted">Size</span>
                      <span className="font-mono text-zinc-200">{formatUSD(p.size)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted">Margin</span>
                      <span className="font-mono text-zinc-200">{formatUSD(p.margin)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted">Entry</span>
                      <span className="font-mono text-zinc-200">{formatUSD(p.entryPrice)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted">Mark</span>
                      <span className="font-mono text-zinc-200">{formatUSD(mark)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted">Liq. Price</span>
                      <span className="font-mono font-semibold text-accent-2">{formatUSD(liq)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted">ROI</span>
                      <PriceChange value={roi} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2">
                    <span className="text-xs text-muted">Unrealized P&amp;L</span>
                    <span className={`font-mono text-sm font-bold ${pnl >= 0 ? "text-long" : "text-short"}`}>
                      {pnl >= 0 ? "+" : ""}
                      {formatUSD(pnl)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/trade/${card.slug}`}
                      className="flex-1 rounded-lg border border-border bg-surface-2 py-2 text-center text-xs font-semibold text-zinc-200 transition-colors hover:border-accent/40"
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => closePosition(p.id, mark)}
                      className="flex-1 rounded-lg border border-short/40 bg-short/10 py-2 text-xs font-semibold text-short transition-colors hover:bg-short/20"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl tracking-wide text-white">
          Trade History{mounted && closedTrades.length > 0 ? ` (${closedTrades.length})` : ""}
        </h2>
        {!mounted || closedTrades.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface py-12 text-center text-muted">
            {mounted ? "No closed trades yet." : "Loading..."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Card</th>
                  <th className="px-4 py-3">Side</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Entry</th>
                  <th className="px-4 py-3">Exit</th>
                  <th className="px-4 py-3">P&amp;L</th>
                  <th className="px-4 py-3">Closed</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((t) => {
                  const card = getCardBySlug(t.cardSlug);
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={card ? `/trade/${card.slug}` : "/markets"}
                          className="line-clamp-1 max-w-[200px] text-zinc-200 hover:text-accent"
                        >
                          {card?.name ?? t.cardSlug}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            t.side === "long" ? "bg-long/15 text-long" : "bg-short/15 text-short"
                          }`}
                        >
                          {t.side} {t.leverage}x
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{formatUSD(t.size)}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{formatUSD(t.entryPrice)}</td>
                      <td className="px-4 py-3 font-mono text-zinc-300">{formatUSD(t.exitPrice)}</td>
                      <td className={`px-4 py-3 font-mono font-semibold ${t.pnl >= 0 ? "text-long" : "text-short"}`}>
                        {t.pnl >= 0 ? "+" : ""}
                        {formatUSD(t.pnl)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {new Date(t.closedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

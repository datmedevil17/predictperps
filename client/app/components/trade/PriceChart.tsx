"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import type { DbzCard, Range } from "@/app/lib/types";
import { generateHistory } from "@/app/lib/mock";
import { formatUSD } from "@/app/lib/format";

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y"];

// Stable references for Recharts props — recreating these on every render makes
// Recharts think its children changed on every tick, which can spiral into
// "Maximum update depth exceeded" once the parent re-renders on a live price feed.
const AXIS_TICK_STYLE = { fill: "#8a8178", fontSize: 11 };
const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 };
const TOOLTIP_CONTENT_STYLE = {
  background: "#161310",
  border: "1px solid #2a241d",
  borderRadius: 8,
  fontSize: 12,
};
const TOOLTIP_LABEL_STYLE = { color: "#8a8178" };
const TOOLTIP_ITEM_STYLE = { color: "#f5f1ec" };

function yTickFormatter(v: number) {
  return formatUSD(v, { compact: true });
}

type TooltipValue = number | string | Array<number | string>;

function tooltipValueFormatter(value: TooltipValue) {
  return [formatUSD(Number(value)), "Price"] as [string, string];
}

function tooltipLabelFormatter(v: number | string) {
  return new Date(Number(v)).toLocaleString();
}

function formatTick(time: number, range: Range): string {
  const date = new Date(time);
  switch (range) {
    case "1D":
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    case "1W":
      return date.toLocaleDateString("en-US", { weekday: "short" });
    case "1M":
    case "3M":
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "1Y":
      return date.toLocaleDateString("en-US", { month: "short" });
  }
}

export function PriceChart({ card, currentPrice }: { card: DbzCard; currentPrice: number }) {
  const [range, setRange] = useState<Range>("1D");

  const data = useMemo(() => generateHistory(card, range), [card, range]);

  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of data) {
      if (p.price < lo) lo = p.price;
      if (p.price > hi) hi = p.price;
    }
    hi = Math.max(hi, currentPrice);
    lo = Math.min(lo, currentPrice);
    const pad = (hi - lo) * 0.08 || hi * 0.02;
    return { min: Math.max(0, lo - pad), max: hi + pad };
  }, [data, currentPrice]);

  const domain = useMemo<[number, number]>(() => [min, max], [min, max]);
  const xTickFormatter = useCallback((v: number) => formatTick(v, range), [range]);
  const referenceLabel = useMemo(
    () => ({
      value: formatUSD(currentPrice),
      position: "insideTopRight" as const,
      fill: "#ffb020",
      fontSize: 11,
    }),
    [currentPrice]
  );

  const first = data[0]?.price ?? currentPrice;
  const rising = currentPrice >= first;
  const lineColor = rising ? "#22c55e" : "#f43f5e";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-accent text-black"
                  : "text-muted hover:bg-surface-2 hover:text-zinc-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tickFormatter={xTickFormatter}
            stroke="#2a241d"
            tick={AXIS_TICK_STYLE}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis
            orientation="right"
            domain={domain}
            tickFormatter={yTickFormatter}
            stroke="#2a241d"
            tick={AXIS_TICK_STYLE}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={tooltipValueFormatter}
            labelFormatter={tooltipLabelFormatter}
          />
          <ReferenceLine
            y={currentPrice}
            stroke="#ffb020"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={referenceLabel}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill="url(#priceFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

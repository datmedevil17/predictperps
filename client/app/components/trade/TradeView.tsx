"use client";

import type { DbzCard, Position } from "@/app/lib/types";
import { usePerpsStore } from "@/app/lib/store";
import { useMounted } from "@/app/lib/useMounted";
import { useEffect, useState } from "react";
import { useProgram, derivePositionPda } from "@/app/lib/useProgram";
import { useStandardWallet } from "@/app/lib/useStandardWallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { MarketSidebar } from "./MarketSidebar";
import { MarketHeader } from "./MarketHeader";
import { PriceChart } from "./PriceChart";
import { MarketTabsSection } from "./MarketTabsSection";
import { CardPreview } from "./CardPreview";
import { OrderPanel } from "./OrderPanel";
import { PositionPanel } from "./PositionPanel";

export function TradeView({ card }: { card: DbzCard }) {
  const mounted = useMounted();
  const price = usePerpsStore((s) => s.markPrice(card));
  
  const { publicKey } = useStandardWallet();
  const { fetchPosition } = useProgram();
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setPosition(null);
      return;
    }
    let active = true;
    const pda = derivePositionPda(card.id, publicKey);
    
    const poll = async () => {
      try {
        const data = await fetchPosition(pda) as any;
        if (!active) return;
        
        if (data) {
          const collateralLamports = data.collateral.toNumber();
          const sizeLamports = data.size.toNumber();
          
          const newPos: Position = {
            id: pda.toBase58(),
            cardSlug: card.slug,
            side: data.isLong ? "long" : "short",
            size: sizeLamports / LAMPORTS_PER_SOL,
            margin: collateralLamports / LAMPORTS_PER_SOL,
            leverage: sizeLamports / collateralLamports,
            entryPrice: data.entryPrice.toNumber() / 1e6,
            openedAt: Date.now(), // Omitted from chain, mock time
            isActive: data.isActive,
          };

          // Sync polled position to the global store so UI components show it
          usePerpsStore.setState((state) => {
            const existing = state.positions.find((p) => p.cardSlug === card.slug);
            if (existing) {
              newPos.openedAt = existing.openedAt; // Preserve original openedAt
              if (
                existing.size === newPos.size &&
                existing.margin === newPos.margin &&
                existing.isActive === newPos.isActive
              ) {
                return state; // No state change needed
              }
            }
            return {
              positions: [
                ...state.positions.filter((p) => p.cardSlug !== card.slug),
                newPos,
              ],
            };
          });

          setPosition(newPos);
        } else {
          setPosition(null);
          // Remove from global store if it was closed or doesn't exist
          usePerpsStore.setState((state) => {
            if (!state.positions.some(p => p.cardSlug === card.slug)) return state;
            return {
              positions: state.positions.filter(p => p.cardSlug !== card.slug)
            };
          });
        }
      } catch (e) {
        console.error("poll fetchPosition:", e);
      }
    };
    
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [publicKey, card.id, card.slug, fetchPosition]);

  return (
    <div className="flex flex-1 flex-col lg:absolute lg:inset-0 lg:flex-row">
      <MarketSidebar activeSlug={card.slug} />

      <div className="flex-1 px-4 py-4 lg:px-6 lg:overflow-y-auto">
        <div className="flex flex-col gap-4 pb-8 lg:pb-12">
          <MarketHeader card={card} />
          <PriceChart card={card} currentPrice={price} />
          <MarketTabsSection card={card} />
        </div>
      </div>

      <div className="w-full shrink-0 border-t border-border p-4 lg:w-80 lg:border-l lg:border-t-0 lg:overflow-y-auto lg:bg-background/50 lg:backdrop-blur">
        <div className="flex flex-col gap-4 pb-8 lg:pb-12">
          <CardPreview card={card} />
          {mounted && position ? (
            <PositionPanel card={card} position={position} />
          ) : (
            <OrderPanel card={card} />
          )}
        </div>
      </div>
    </div>
  );
}

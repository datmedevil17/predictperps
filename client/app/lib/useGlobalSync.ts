"use client";

import { useEffect } from "react";
import { useProgram } from "@/app/lib/useProgram";
import { useStandardWallet } from "@/app/lib/useStandardWallet";
import { usePerpsStore } from "@/app/lib/store";
import { DBZ_CARDS } from "@/app/lib/cards";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Position } from "@/app/lib/types";

export function useGlobalSync() {
  const { program } = useProgram();
  const { publicKey } = useStandardWallet();
  
  useEffect(() => {
    if (!program || !publicKey) return;
    
    const fetchAll = async () => {
      try {
        const positions = await (program.account as any).position.all([
          {
            memcmp: {
              offset: 8 + 8, // 8 byte discriminator + 8 byte u64 marketId
              bytes: publicKey.toBase58(),
            }
          }
        ]);
        
        const parsedPositions = positions.map((p: any) => {
          const data = p.account;
          const marketId = data.marketId.toNumber();
          const card = DBZ_CARDS.find(c => c.id === marketId);
          if (!card) return null;
          
          const collateralLamports = data.collateral.toNumber();
          const sizeLamports = data.size.toNumber();
          
          return {
            id: p.publicKey.toBase58(),
            cardSlug: card.slug,
            side: data.isLong ? "long" : "short",
            size: sizeLamports / LAMPORTS_PER_SOL,
            margin: collateralLamports / LAMPORTS_PER_SOL,
            leverage: sizeLamports / collateralLamports,
            entryPrice: data.entryPrice.toNumber() / 1e6,
            openedAt: Date.now(), 
            isActive: data.isActive,
          };
        }).filter(Boolean);
        
        usePerpsStore.setState((state) => {
          const newStorePositions = (parsedPositions as Position[]).map(pos => {
            const existing = state.positions.find(p => p.id === pos.id);
            if (existing) pos.openedAt = existing.openedAt;
            return pos;
          });
          return { positions: newStorePositions };
        });
        
      } catch (e) {
        console.error("Global position sync error:", e);
      }
    };
    
    fetchAll();
    
    // Periodically sync all every 10s just to be safe. 
    // The TradeView poll is every 2s for the active market.
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, [program, publicKey]);
}

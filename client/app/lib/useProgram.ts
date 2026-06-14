/**
 * useProgram — Anchor program hook for the on-chain `perp` program.
 *
 * Uses Privy's embedded Solana wallet as the signer so every transaction is
 * signed silently — no wallet extension popups, ever.
 *
 * PDA seeds:
 *   Position: ["position", market_id_le8, owner_pubkey]
 *
 * Instruction summary:
 *   openPosition    · closePosition   · liquidatePosition
 *   delegatePosition · revealPosition · settleFunds
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";
import { AnchorProvider, BN, Program, type Provider } from "@coral-xyz/anchor";
import {
  type Commitment,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { useStandardWallet, useSilentSign, useSilentSignMessage } from "./useStandardWallet";
import type { Perp } from "@/app/idl/perp";
import PerpIdl from "@/app/idl/perp.json";

// ─── Program / endpoint constants ─────────────────────────────────────────────

export const PERP_PROGRAM_ID = new PublicKey(
  "7e8rqStv4BdBfGpdRisahbmSc4EaivevxKuzgUhc7uxS"
);

const TEE_ENDPOINT = (
  process.env.NEXT_PUBLIC_TEE_PROVIDER_ENDPOINT ??
  "https://devnet-tee.magicblock.app"
).replace(/\/$/, "");

const TEE_WS_ENDPOINT = TEE_ENDPOINT.replace(/^https:\/\//, "wss://").replace(
  /^http:\/\//,
  "ws://"
);

// ─── PDA helper ───────────────────────────────────────────────────────────────

/**
 * Derive the Position PDA.
 * Seeds: ["position", market_id_le8_bytes, owner_pubkey]
 */
export function derivePositionPda(
  marketId: bigint | number,
  owner: PublicKey
): PublicKey {
  const idBuf = new BN(marketId.toString()).toArrayLike(Buffer, "le", 8);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), idBuf, owner.toBytes()],
    PERP_PROGRAM_ID
  );
  return pda;
}

// ─── Account shape types ──────────────────────────────────────────────────────

export interface PositionAccount {
  marketId: BN;
  owner: PublicKey;
  isLong: boolean;
  collateral: BN;
  entryPrice: BN;
  size: BN;
  isActive: boolean;
  finalPayout: BN;
  liquidator: PublicKey | null;
  liquidatorReward: BN;
  bump: number;
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseProgramReturn {
  program: Program<Perp> | null;
  loading: boolean;

  openPosition: (
    marketId: bigint | number,
    isLong: boolean,
    collateral: bigint | number,
    leverage: bigint | number,
    currentPrice: bigint | number
  ) => Promise<string | null>;

  closePosition: (
    positionPda: PublicKey,
    currentPrice: bigint | number
  ) => Promise<string | null>;

  liquidatePosition: (
    positionPda: PublicKey,
    currentPrice: bigint | number
  ) => Promise<string | null>;

  delegatePosition: (
    marketId: bigint | number,
    members?: { flags: number; pubkey: PublicKey }[] | null
  ) => Promise<string | null>;

  revealPosition: (marketId: bigint | number) => Promise<string | null>;

  settleFunds: (
    positionPda: PublicKey,
    liquidatorPda?: PublicKey
  ) => Promise<string | null>;

  fetchPosition: (positionPda: PublicKey) => Promise<PositionAccount | null>;

  ephemeralConnection: Connection | null;
  isInitializingEr: boolean;
  initEphemeralConnection: () => Promise<void>;
}

// ─── Minimal read-only provider (pre-login) ───────────────────────────────────

class ReadOnlyProvider implements Provider {
  readonly connection: Connection;
  readonly publicKey?: PublicKey;
  constructor(connection: Connection, publicKey?: PublicKey) {
    this.connection = connection;
    this.publicKey = publicKey;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgram(): UseProgramReturn {
  const { connection } = useConnection();
  const {
    publicKey,
    authenticated,
    refreshBalance,
  } = useStandardWallet();

  const { silentSign, hasWallet } = useSilentSign();
  const { silentSignMessage } = useSilentSignMessage();

  const [program, setProgram] = useState<Program<Perp> | null>(null);
  const [loading, setLoading] = useState(true);
  const [ephemeralConnection, setEphemeralConnection] =
    useState<Connection | null>(null);
  const [isInitializingEr, setIsInitializingEr] = useState(false);

  const cachedAuthToken = useRef<{ pubkey: string; token: string } | null>(null);

  // `silentSign` is recreated on every render by Privy's hooks, so it can't be
  // a dependency of the build effect below without causing an infinite loop.
  // Stash the latest version in a ref and read it from the wallet shim instead.
  const silentSignRef = useRef(silentSign);
  silentSignRef.current = silentSign;

  // ── Build program client ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const build = async () => {
      setLoading(true);
      try {
        let provider: Provider;
        if (publicKey && hasWallet) {
          // AnchorProvider with the embedded wallet shim.
          const walletShim = {
            publicKey,
            signTransaction: async <T extends Transaction>(tx: T) => {
              const signed = await silentSignRef.current(tx);
              if (!signed) throw new Error("Failed to sign tx");
              return Transaction.from(signed) as T;
            },
            signAllTransactions: async <T extends Transaction>(txs: T[]) =>
              Promise.all(
                txs.map(async (tx) => {
                  const signed = await silentSignRef.current(tx);
                  if (!signed) throw new Error("Failed to sign tx");
                  return Transaction.from(signed) as T;
                })
              ),
          };
          provider = new AnchorProvider(connection, walletShim as any, {
            commitment: "processed",
          });
        } else {
          provider = new ReadOnlyProvider(connection, publicKey ?? undefined);
        }
        const p = new Program<Perp>(PerpIdl as any, provider);
        if (!cancelled) {
          setProgram(p);
          setLoading(false);
        }
      } catch (err) {
        console.error("[useProgram] build:", err);
        if (!cancelled) setLoading(false);
      }
    };
    build();
    return () => { cancelled = true; };
  }, [connection, publicKey, hasWallet]);

  // ── TEE ephemeral-rollup connection ───────────────────────────────────────

  const initEphemeralConnection = useCallback(async () => {
    if (!publicKey || !hasWallet) {
      console.warn("[useProgram] wallet not ready for TEE auth");
      return;
    }
    setIsInitializingEr(true);
    try {
      let token: string;
      const cached = cachedAuthToken.current;
      if (cached && cached.pubkey === publicKey.toBase58()) {
        token = cached.token;
      } else {
        const result = await getAuthToken(
          TEE_ENDPOINT,
          publicKey,
          async (message: Uint8Array) => {
            const sig = await silentSignMessage(message);
            if (!sig) throw new Error("Failed to sign TEE message");
            return sig;
          }
        );
        token = result.token;
        cachedAuthToken.current = { pubkey: publicKey.toBase58(), token };
      }
      const cluster = `${TEE_ENDPOINT}?token=${token}`;
      const wsEndpoint = `${TEE_WS_ENDPOINT}?token=${token}`;
      setEphemeralConnection(
        new Connection(cluster, { wsEndpoint, commitment: "confirmed" })
      );
    } catch (err) {
      console.error("[useProgram] TEE auth failed:", err);
    } finally {
      setIsInitializingEr(false);
    }
  }, [publicKey, hasWallet, silentSignMessage]);

  // ── Ensure embedded wallet is funded (devnet: airdrop) ────────────────────

  const ensureFunded = useCallback(async () => {
    if (!publicKey) return;
    const info = await connection.getAccountInfo(publicKey);
    if (!info || info.lamports < 0.01 * LAMPORTS_PER_SOL) {
      console.log("[useProgram] airdropping to embedded wallet");
      await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await refreshBalance();
    }
  }, [connection, publicKey, refreshBalance]);

  // ── Internal: sign with embedded wallet → sendRawTransaction (no popup) ───

  const submitTx = useCallback(
    async (
      tx: Transaction,
      {
        ephemeral = false,
        commitment = "processed" as Commitment,
      }: { ephemeral?: boolean; commitment?: Commitment } = {}
    ): Promise<string | null> => {
      if (!publicKey || !hasWallet) {
        console.warn("[useProgram] embedded wallet not ready");
        return null;
      }

      const targetConnection =
        ephemeral && ephemeralConnection ? ephemeralConnection : connection;

      const {
        value: { blockhash, lastValidBlockHeight },
      } = await targetConnection.getLatestBlockhashAndContext();

      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      // Sign silently with the Privy embedded wallet — zero popup.
      const signedBytes = await silentSign(tx);
      if (!signedBytes) {
        console.error("[useProgram] signature failed or rejected");
        return null;
      }

      const signature = await targetConnection.sendRawTransaction(signedBytes, {
        skipPreflight: true,
      });

      await targetConnection.confirmTransaction(
        { blockhash, lastValidBlockHeight, signature },
        commitment
      );

      await refreshBalance();
      return signature;
    },
    [connection, ephemeralConnection, publicKey, silentSign, hasWallet, refreshBalance]
  );

  // ── openPosition ───────────────────────────────────────────────────────────

  const openPosition = useCallback(
    async (
      marketId: bigint | number,
      isLong: boolean,
      collateral: bigint | number,
      leverage: bigint | number,
      currentPrice: bigint | number
    ): Promise<string | null> => {
      if (!program || !publicKey) return null;
      try {
        await ensureFunded();
        const tx = await (program.methods as any)
          .openPosition(
            new BN(marketId.toString()),
            isLong,
            new BN(collateral.toString()),
            new BN(leverage.toString()),
            new BN(currentPrice.toString())
          )
          .accounts({ owner: publicKey })
          .transaction();
        return submitTx(tx);
      } catch (err) {
        console.error("[useProgram] openPosition:", err);
        return null;
      }
    },
    [program, publicKey, ensureFunded, submitTx]
  );

  // ── closePosition ──────────────────────────────────────────────────────────

  const closePosition = useCallback(
    async (
      positionPda: PublicKey,
      currentPrice: bigint | number
    ): Promise<string | null> => {
      if (!program || !publicKey) return null;
      try {
        const tx = await (program.methods as any)
          .closePosition(new BN(currentPrice.toString()))
          .accounts({ owner: publicKey, position: positionPda })
          .transaction();
        return submitTx(tx, { ephemeral: !!ephemeralConnection });
      } catch (err) {
        console.error("[useProgram] closePosition:", err);
        return null;
      }
    },
    [program, publicKey, ephemeralConnection, submitTx]
  );

  // ── liquidatePosition ──────────────────────────────────────────────────────

  const liquidatePosition = useCallback(
    async (
      positionPda: PublicKey,
      currentPrice: bigint | number
    ): Promise<string | null> => {
      if (!program || !publicKey) return null;
      try {
        const tx = await (program.methods as any)
          .liquidatePosition(new BN(currentPrice.toString()))
          .accounts({ liquidator: publicKey, position: positionPda })
          .transaction();
        return submitTx(tx, { ephemeral: !!ephemeralConnection });
      } catch (err) {
        console.error("[useProgram] liquidatePosition:", err);
        return null;
      }
    },
    [program, publicKey, ephemeralConnection, submitTx]
  );

  // ── delegatePosition ───────────────────────────────────────────────────────

  const delegatePosition = useCallback(
    async (
      marketId: bigint | number,
      members: { flags: number; pubkey: PublicKey }[] | null = null
    ): Promise<string | null> => {
      if (!program || !publicKey) return null;
      try {
        await ensureFunded();
        const membersArg = members?.map((m) => ({ flags: m.flags, pubkey: m.pubkey })) ?? null;
        const tx = await (program.methods as any)
          .delegate(new BN(marketId.toString()), membersArg)
          .accounts({ payer: publicKey, validator: null })
          .transaction();
        return submitTx(tx, { commitment: "confirmed" });
      } catch (err) {
        console.error("[useProgram] delegatePosition:", err);
        return null;
      }
    },
    [program, publicKey, ensureFunded, submitTx]
  );

  // ── revealPosition ─────────────────────────────────────────────────────────

  const revealPosition = useCallback(
    async (marketId: bigint | number): Promise<string | null> => {
      if (!program || !publicKey) return null;
      try {
        const positionPda = derivePositionPda(marketId, publicKey);
        const tx = await (program.methods as any)
          .revealPosition(new BN(marketId.toString()))
          .accounts({ 
            payer: publicKey,
            position: positionPda,
          })
          .transaction();
        return submitTx(tx, { ephemeral: true });
      } catch (err) {
        console.error("[useProgram] revealPosition:", err);
        return null;
      }
    },
    [program, publicKey, submitTx]
  );

  // ── settleFunds ────────────────────────────────────────────────────────────

  const settleFunds = useCallback(
    async (
      positionPda: PublicKey,
      liquidatorPda?: PublicKey
    ): Promise<string | null> => {
      if (!program || !publicKey) return null;
      try {
        const tx: Transaction = await (program.methods as any)
          .settleFunds()
          .accounts({
            caller: publicKey,
            owner: publicKey,
            position: positionPda,
            liquidator: liquidatorPda ?? null,
          })
          .transaction();
        return submitTx(tx, { commitment: "confirmed" });
      } catch (err) {
        console.error("[useProgram] settleFunds:", err);
        return null;
      }
    },
    [program, publicKey, submitTx]
  );

  // ── fetchPosition ──────────────────────────────────────────────────────────

  const fetchPosition = useCallback(
    async (positionPda: PublicKey): Promise<PositionAccount | null> => {
      if (!program) return null;
      try {
        return (await (program.account as any).position.fetch(
          positionPda
        )) as PositionAccount;
      } catch {
        return null;
      }
    },
    [program]
  );

  // ──────────────────────────────────────────────────────────────────────────

  return useMemo(
    () => ({
      program,
      loading,
      openPosition,
      closePosition,
      liquidatePosition,
      delegatePosition,
      revealPosition,
      settleFunds,
      fetchPosition,
      ephemeralConnection,
      isInitializingEr,
      initEphemeralConnection,
    }),
    [
      program,
      loading,
      openPosition,
      closePosition,
      liquidatePosition,
      delegatePosition,
      revealPosition,
      settleFunds,
      fetchPosition,
      ephemeralConnection,
      isInitializingEr,
      initEphemeralConnection,
    ]
  );
}

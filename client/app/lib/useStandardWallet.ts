"use client";

import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

const BALANCE_POLL_MS = 15_000;

interface BalanceStore {
  balance: number | null;
  setBalance: (b: number | null) => void;
}

export const useBalanceStore = create<BalanceStore>((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
}));

export interface StandardWalletState {
  ready: boolean;
  authenticated: boolean;
  publicKey: PublicKey | null;
  address: string | null;
  balance: number | null;
  wallet: any | null;
  login: () => void;
  logout: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

export function useStandardWallet(): StandardWalletState {
  const { wallet, publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const { balance, setBalance } = useBalanceStore();

  const address = publicKey?.toBase58() ?? null;

  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      // ignore RPC hiccups
    }
  }, [connection, publicKey, setBalance]);

  useEffect(() => {
    refreshBalance();
    const id = setInterval(refreshBalance, BALANCE_POLL_MS);
    return () => clearInterval(id);
  }, [refreshBalance]);

  const login = useCallback(() => setVisible(true), [setVisible]);
  const logout = useCallback(async () => { await disconnect(); }, [disconnect]);

  const readyState = wallet?.readyState || wallet?.adapter?.readyState;

  return {
    ready: readyState === 'Installed' || readyState === 'Loadable',
    authenticated: connected,
    publicKey,
    address,
    balance,
    wallet,
    login,
    logout,
    refreshBalance,
  };
}

export function useSilentSign() {
  const { signTransaction, wallet } = useWallet();

  const silentSign = useCallback(
    async (tx: Transaction): Promise<Uint8Array | null> => {
      if (!signTransaction) return null;
      // Use standard wallet adapter signature
      const signedTx = await signTransaction(tx);
      return signedTx.serialize({ requireAllSignatures: false });
    },
    [signTransaction]
  );

  return { silentSign, hasWallet: !!wallet };
}

export function useSilentSignMessage() {
  const { signMessage, wallet } = useWallet();

  const silentSignMessage = useCallback(
    async (message: Uint8Array): Promise<Uint8Array | null> => {
      if (!signMessage) return null;
      return await signMessage(message);
    },
    [signMessage]
  );

  return { silentSignMessage, hasWallet: !!wallet };
}

"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, ExternalLink, LogOut, Wallet, ChevronDown } from "lucide-react";
import { useStandardWallet } from "@/app/lib/useStandardWallet";
import { useMounted } from "@/app/lib/useMounted";

function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function StandardWalletButton() {
  const mounted = useMounted();
  const { ready, authenticated, address, balance, login, logout } = useStandardWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!mounted || !ready) {
    return (
      <div className="h-9 w-36 animate-pulse rounded-lg border border-border bg-surface" />
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:border-accent/60 hover:bg-surface-2"
      >
        <Wallet size={15} className="text-accent" />
        Connect
      </button>
    );
  }

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const solBalance =
    balance !== null ? `${balance.toFixed(3)} SOL` : "— SOL";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:border-accent/60 hover:bg-surface-2"
      >
        {/* Sol icon */}
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-accent text-[10px] font-bold text-black">
          ◎
        </span>
        <span className="font-mono text-xs text-accent">{solBalance}</span>
        <span className="hidden text-zinc-400 sm:inline">·</span>
        <span className="hidden font-mono text-xs text-zinc-300 sm:inline">
          {address ? truncate(address) : ""}
        </span>
        <ChevronDown
          size={13}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          {/* Wallet info header */}
          <div className="border-b border-border bg-surface-2 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Connected Wallet
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-200 break-all">
              {address}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-white">
              {solBalance}
            </p>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5"
            >
              <Copy size={14} className="text-muted" />
              {copied ? "Copied!" : "Copy address"}
            </button>

            <a
              href={`https://explorer.solana.com/address/${address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5"
            >
              <ExternalLink size={14} className="text-muted" />
              View on Explorer
            </a>

            <div className="my-1 border-t border-border" />

            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

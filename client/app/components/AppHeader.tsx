"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Plus, Search, User } from "lucide-react";
import { StandardWalletButton } from "./StandardWalletButton";
import { useMounted } from "@/app/lib/useMounted";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const [query, setQuery] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/markets?q=${encodeURIComponent(query.trim())}` : "/markets");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Limit Break Logo" width={180} height={40} className="h-6 w-auto object-contain" priority />
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
            Beta
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/markets"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname?.startsWith("/markets")
                ? "bg-surface-2 text-white"
                : "text-muted hover:text-white"
            }`}
          >
            Markets
          </Link>
        </nav>

        <form onSubmit={onSearch} className="ml-auto flex-1 sm:max-w-xs">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus-within:border-accent/60">
            <Search size={15} className="text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full bg-transparent text-zinc-100 placeholder:text-muted focus:outline-none"
            />
          </div>
        </form>

        <div className="hidden items-center gap-2 sm:flex">
          <StandardWalletButton />
          <Link
            href="/portfolio"
            className={`flex h-[37px] w-[37px] items-center justify-center rounded-lg border transition-colors hover:border-accent/60 ${
              pathname?.startsWith("/portfolio")
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border bg-surface text-muted hover:text-zinc-200"
            }`}
            title="My Profile"
          >
            <User size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}

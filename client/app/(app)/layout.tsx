"use client";

import { AppHeader } from "@/app/components/AppHeader";
import { Footer } from "@/app/components/Footer";
import { useMarketTicker } from "@/app/lib/useMarketTicker";
import { useGlobalSync } from "@/app/lib/useGlobalSync";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  useMarketTicker();
  useGlobalSync();

  return (
    <div className="flex min-h-screen flex-col bg-grid lg:h-screen lg:overflow-hidden">
      <AppHeader />
      <main className="flex-1 relative flex flex-col lg:min-h-0 lg:overflow-y-auto">
        {children}
        <Footer />
      </main>
    </div>
  );
}

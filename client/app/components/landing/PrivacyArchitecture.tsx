export function PrivacyArchitecture() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-black/40">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 font-display text-3xl tracking-wide text-white sm:text-4xl text-glow">
            Privacy-Powered Architecture
          </h2>
          <p className="text-lg text-muted">
            Trade with absolute confidence. Our protocol is built on a foundation of cryptography to ensure your trading strategies and wallet data remain completely private.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-surface/50 p-8 text-center backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <h3 className="mb-3 text-lg font-bold text-zinc-100">Zero-Knowledge Proofs</h3>
            <p className="text-sm text-muted">
              Your positions are mathematically verified without exposing your sizing or entry price to on-chain sleuths.
            </p>
          </div>

          <div className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-surface/50 p-8 text-center backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <h3 className="mb-3 text-lg font-bold text-zinc-100">Anti-MEV Engine</h3>
            <p className="text-sm text-muted">
              Encrypted mempool transactions ensure your trades are completely protected from front-running and sandwich attacks.
            </p>
          </div>

          <div className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-surface/50 p-8 text-center backdrop-blur-sm transition-colors hover:border-accent/40 hover:bg-surface">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <h3 className="mb-3 text-lg font-bold text-zinc-100">Permissionless</h3>
            <p className="text-sm text-muted">
              Connect and trade instantly. No KYC, no intrusive onboarding, and your identity is decoupled from your wallet.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

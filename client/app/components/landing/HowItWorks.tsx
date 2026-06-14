import { Gauge, LineChart, ShieldAlert, Wallet } from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "Start with $1,000",
    description:
      "Every wallet starts with a mock $1,000 balance. Reset it anytime — it's all simulated, zero risk.",
  },
  {
    icon: LineChart,
    title: "Pick Your Card",
    description:
      "Browse 100+ real Dragon Ball Super CCG cards with live TCGplayer market prices and trend charts.",
  },
  {
    icon: Gauge,
    title: "Go Long or Short, up to 50x",
    description:
      "Believe a card is about to power up? Go long. Think it's about to get nerfed? Short it — with up to 50x leverage.",
  },
  {
    icon: ShieldAlert,
    title: "Track P&L & Liquidation",
    description:
      "Watch unrealized P&L update live as prices tick, manage margin, and avoid liquidation when the market moves against you.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-8 text-center font-display text-2xl tracking-wide text-white sm:text-3xl">
          How <span className="text-accent">Limit Break</span> Works
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <step.icon size={20} />
                </span>
                <span className="font-display text-3xl text-border">0{i + 1}</span>
              </div>
              <h3 className="font-display text-lg tracking-wide text-white">{step.title}</h3>
              <p className="text-sm text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

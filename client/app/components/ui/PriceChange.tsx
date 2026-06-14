import { ArrowDown, ArrowUp } from "lucide-react";
import { formatPercent } from "@/app/lib/format";

export function PriceChange({
  value,
  className = "",
  showIcon = false,
}: {
  value: number;
  className?: string;
  showIcon?: boolean;
}) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono font-medium ${
        positive ? "text-long" : "text-short"
      } ${className}`}
    >
      {showIcon &&
        (positive ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />)}
      {formatPercent(value)}
    </span>
  );
}

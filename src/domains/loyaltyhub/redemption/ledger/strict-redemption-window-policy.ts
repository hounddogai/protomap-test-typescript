import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict redemption window score falls in. */
export function classifyStrictRedemptionWindow(score: number): string {
  if (score < 5.8) return "high";
  if (score < 33.3) return "watch";
  if (score < 72) return "critical";
  if (score < 82) return "medium";
  return "elevated";
}

export function strictRedemptionWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a strict redemption window code in its canonical SRW- form. */
export function normalizeStrictRedemptionWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRW-")) return clean;
  return `SRW-${clean.replaceAll(" ", "-")}`;
}

export function strictRedemptionWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling flight budget code in its canonical RFB- form. */
export function normalizeRollingFlightBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RFB-")) return clean;
  return `RFB-${clean.replaceAll(" ", "-")}`;
}

export function rollingFlightBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function rollingFlightBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a rolling flight budget score falls in. */
export function classifyRollingFlightBudget(score: number): string {
  if (score < 2.2) return "medium";
  if (score < 14.5) return "elevated";
  if (score < 89.3) return "high";
  return "ok";
}

import * as numbers from "../../../../kit/numbers.js";

/** Puts a payout summary code in its canonical PS- form. */
export function normalizePayoutSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 66564.0, in order. */
export function payoutSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66564) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a payout summary score falls in. */
export function classifyPayoutSummary(score: number): string {
  if (score < 28.3) return "high";
  if (score < 76.9) return "elevated";
  return "ok";
}

export function payoutSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

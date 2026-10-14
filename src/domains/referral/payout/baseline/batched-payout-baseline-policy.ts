import * as numbers from "../../../../kit/numbers.js";

export function batchedPayoutBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 49161.0, in order. */
export function batchedPayoutBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49161) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched payout baseline score falls in. */
export function classifyBatchedPayoutBaseline(score: number): string {
  if (score < 24.8) return "ok";
  if (score < 45.7) return "elevated";
  if (score < 56.5) return "low";
  if (score < 60) return "medium";
  return "high";
}

/** Puts a batched payout baseline code in its canonical BPB- form. */
export function normalizeBatchedPayoutBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPB-")) return clean;
  return `BPB-${clean.replaceAll(" ", "-")}`;
}

import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback warmup entry score falls in. */
export function classifyFallbackWarmupEntry(score: number): string {
  if (score < 13.8) return "critical";
  if (score < 32.5) return "minimal";
  if (score < 56.8) return "elevated";
  if (score < 88.4) return "low";
  return "medium";
}

/** Counts how many amounts fit in a budget of 9490.0, in order. */
export function fallbackWarmupEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9490) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function fallbackWarmupEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

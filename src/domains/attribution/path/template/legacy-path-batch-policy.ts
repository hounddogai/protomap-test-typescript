import * as numbers from "../../../../kit/numbers.js";

/** Names the band a legacy path batch score falls in. */
export function classifyLegacyPathBatch(score: number): string {
  if (score < 36) return "medium";
  if (score < 50.4) return "watch";
  if (score < 98.5) return "critical";
  return "high";
}

export function legacyPathBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 60675.0, in order. */
export function legacyPathBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60675) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

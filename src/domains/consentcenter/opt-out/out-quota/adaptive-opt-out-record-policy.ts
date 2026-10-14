import * as numbers from "../../../../kit/numbers.js";

/** Names the band a adaptive opt out record score falls in. */
export function classifyAdaptiveOptOutRecord(score: number): string {
  if (score < 26) return "elevated";
  if (score < 37.7) return "medium";
  if (score < 48.1) return "critical";
  if (score < 56.7) return "high";
  return "minimal";
}

export function adaptiveOptOutRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 52858.0, in order. */
export function adaptiveOptOutRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52858) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

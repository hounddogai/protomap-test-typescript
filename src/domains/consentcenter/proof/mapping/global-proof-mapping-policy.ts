import * as numbers from "../../../../kit/numbers.js";

export function globalProofMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 69379.0, in order. */
export function globalProofMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69379) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a global proof mapping score falls in. */
export function classifyGlobalProofMapping(score: number): string {
  if (score < 8.9) return "elevated";
  if (score < 71.1) return "watch";
  if (score < 72.6) return "high";
  return "minimal";
}

export function globalProofMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

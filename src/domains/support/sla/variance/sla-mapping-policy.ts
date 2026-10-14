import * as numbers from "../../../../kit/numbers.js";

/** Names the band a sla mapping score falls in. */
export function classifySlaMapping(score: number): string {
  if (score < 11.7) return "elevated";
  if (score < 21.6) return "high";
  if (score < 27.6) return "minimal";
  return "watch";
}

export function slaMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function slaMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 95613.0, in order. */
export function slaMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95613) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

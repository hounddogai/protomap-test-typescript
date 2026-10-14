import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global sla milestone score falls in. */
export function classifyGlobalSlaMilestone(score: number): string {
  if (score < 33.3) return "high";
  if (score < 78) return "medium";
  return "elevated";
}

export function globalSlaMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function globalSlaMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 46810.0, in order. */
export function globalSlaMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 46810) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

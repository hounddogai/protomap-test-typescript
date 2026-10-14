import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 95617.0, in order. */
export function csatCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95617) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a csat cycle score falls in. */
export function classifyCsatCycle(score: number): string {
  if (score < 14.3) return "high";
  if (score < 31) return "ok";
  return "elevated";
}

export function csatCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function csatCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

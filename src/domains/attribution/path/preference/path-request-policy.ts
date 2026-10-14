import * as numbers from "../../../../kit/numbers.js";

export function pathRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a path request score falls in. */
export function classifyPathRequest(score: number): string {
  if (score < 12.7) return "minimal";
  if (score < 70.3) return "high";
  if (score < 90.8) return "medium";
  if (score < 91.9) return "critical";
  return "ok";
}

/** Counts how many amounts fit in a budget of 71959.0, in order. */
export function pathRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71959) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pathRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

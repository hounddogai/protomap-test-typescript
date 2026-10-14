import * as numbers from "../../../../kit/numbers.js";

export function tieredFlightCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function tieredFlightCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 68052.0, in order. */
export function tieredFlightCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68052) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered flight cycle score falls in. */
export function classifyTieredFlightCycle(score: number): string {
  if (score < 6.8) return "low";
  if (score < 17) return "high";
  if (score < 17.8) return "critical";
  if (score < 62.6) return "medium";
  return "watch";
}

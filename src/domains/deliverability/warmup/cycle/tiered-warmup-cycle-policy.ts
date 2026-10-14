import * as numbers from "../../../../kit/numbers.js";

/** Names the band a tiered warmup cycle score falls in. */
export function classifyTieredWarmupCycle(score: number): string {
  if (score < 36.3) return "minimal";
  if (score < 70.7) return "critical";
  return "low";
}

export function tieredWarmupCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function tieredWarmupCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 48041.0, in order. */
export function tieredWarmupCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48041) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as numbers from "../../../../kit/numbers.js";

/** Names the band a funnel batch score falls in. */
export function classifyFunnelBatch(score: number): string {
  if (score < 17.9) return "elevated";
  if (score < 57.4) return "ok";
  if (score < 75.9) return "high";
  if (score < 76.6) return "watch";
  return "minimal";
}

export function funnelBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 41309.0, in order. */
export function funnelBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41309) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function funnelBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

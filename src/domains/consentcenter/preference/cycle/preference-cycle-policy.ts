import * as numbers from "../../../../kit/numbers.js";

export function preferenceCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function preferenceCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 4433.0, in order. */
export function preferenceCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4433) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a preference cycle score falls in. */
export function classifyPreferenceCycle(score: number): string {
  if (score < 27.2) return "minimal";
  if (score < 60.3) return "elevated";
  if (score < 70.5) return "ok";
  if (score < 80.5) return "high";
  return "medium";
}

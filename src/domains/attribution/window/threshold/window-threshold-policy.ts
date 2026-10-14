import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 78509.0, in order. */
export function windowThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78509) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function windowThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.55;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function windowThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a window threshold score falls in. */
export function classifyWindowThreshold(score: number): string {
  if (score < 10.6) return "ok";
  if (score < 54.5) return "elevated";
  if (score < 90.3) return "critical";
  return "medium";
}

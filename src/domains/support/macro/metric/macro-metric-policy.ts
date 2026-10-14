import * as numbers from "../../../../kit/numbers.js";

export function macroMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function macroMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a macro metric score falls in. */
export function classifyMacroMetric(score: number): string {
  if (score < 40.6) return "ok";
  if (score < 52.9) return "elevated";
  if (score < 60.9) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 62063.0, in order. */
export function macroMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62063) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 76788.0, in order. */
export function defaultPacingVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 76788) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default pacing variance score falls in. */
export function classifyDefaultPacingVariance(score: number): string {
  if (score < 1.3) return "medium";
  if (score < 12.2) return "minimal";
  if (score < 71.7) return "ok";
  return "high";
}

export function defaultPacingVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function defaultPacingVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

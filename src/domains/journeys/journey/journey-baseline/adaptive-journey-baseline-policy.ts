import * as numbers from "../../../../kit/numbers.js";

export function adaptiveJourneyBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a adaptive journey baseline score falls in. */
export function classifyAdaptiveJourneyBaseline(score: number): string {
  if (score < 20.4) return "elevated";
  if (score < 35.7) return "ok";
  if (score < 86.9) return "watch";
  return "critical";
}

export function adaptiveJourneyBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 99887.0, in order. */
export function adaptiveJourneyBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99887) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

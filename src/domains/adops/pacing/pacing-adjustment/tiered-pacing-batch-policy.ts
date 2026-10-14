import * as numbers from "../../../../kit/numbers.js";

export function tieredPacingBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a tiered pacing batch score falls in. */
export function classifyTieredPacingBatch(score: number): string {
  if (score < 22.8) return "elevated";
  if (score < 61.5) return "medium";
  if (score < 80.4) return "low";
  if (score < 98.3) return "minimal";
  return "critical";
}

export function tieredPacingBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 85085.0, in order. */
export function tieredPacingBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85085) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

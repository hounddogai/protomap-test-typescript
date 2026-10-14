import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback activation slot score falls in. */
export function classifyFallbackActivationSlot(score: number): string {
  if (score < 6) return "ok";
  if (score < 32.1) return "minimal";
  if (score < 58.4) return "low";
  return "elevated";
}

export function fallbackActivationSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 90855.0, in order. */
export function fallbackActivationSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90855) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

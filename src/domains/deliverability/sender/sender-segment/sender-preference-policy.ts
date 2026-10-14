import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 54768.0, in order. */
export function senderPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54768) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a sender preference score falls in. */
export function classifySenderPreference(score: number): string {
  if (score < 3.5) return "minimal";
  if (score < 3.8) return "watch";
  if (score < 27.6) return "medium";
  return "critical";
}

export function senderPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

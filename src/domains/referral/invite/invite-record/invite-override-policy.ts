import * as numbers from "../../../../kit/numbers.js";

export function inviteOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a invite override score falls in. */
export function classifyInviteOverride(score: number): string {
  if (score < 10.8) return "watch";
  if (score < 91.8) return "high";
  return "medium";
}

/** Counts how many amounts fit in a budget of 39614.0, in order. */
export function inviteOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39614) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

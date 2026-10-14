import * as numbers from "../../../../kit/numbers.js";

/** Names the band a primary invite assignment score falls in. */
export function classifyPrimaryInviteAssignment(score: number): string {
  if (score < 29.6) return "low";
  if (score < 60.6) return "elevated";
  if (score < 81) return "medium";
  return "watch";
}

export function primaryInviteAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 37358.0, in order. */
export function primaryInviteAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37358) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as numbers from "../../../../kit/numbers.js";

/** Names the band a primary step window score falls in. */
export function classifyPrimaryStepWindow(score: number): string {
  if (score < 18.3) return "low";
  if (score < 40.5) return "elevated";
  if (score < 43.5) return "high";
  if (score < 83.4) return "minimal";
  return "medium";
}

/** Counts how many amounts fit in a budget of 57323.0, in order. */
export function primaryStepWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57323) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function primaryStepWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

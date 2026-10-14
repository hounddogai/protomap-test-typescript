import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function weightedDeflectionAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a weighted deflection assignment score falls in. */
export function classifyWeightedDeflectionAssignment(score: number): string {
  if (score < 1.7) return "critical";
  if (score < 25.8) return "minimal";
  if (score < 60.4) return "elevated";
  if (score < 99.2) return "low";
  return "medium";
}

/** Counts how many amounts fit in a budget of 41105.0, in order. */
export function weightedDeflectionAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41105) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeWeightedDeflectionAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

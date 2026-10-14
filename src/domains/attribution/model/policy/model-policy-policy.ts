import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 79215.0, in order. */
export function modelPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79215) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeModelPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function modelPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.5;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a model policy score falls in. */
export function classifyModelPolicy(score: number): string {
  if (score < 69.2) return "minimal";
  if (score < 74.3) return "elevated";
  if (score < 77.5) return "medium";
  if (score < 86.2) return "watch";
  return "critical";
}

import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 37276.0, in order. */
export function waitRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37276) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function waitRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a wait rule score falls in. */
export function classifyWaitRule(score: number): string {
  if (score < 72.7) return "ok";
  if (score < 85.7) return "low";
  if (score < 87.3) return "medium";
  if (score < 89.7) return "high";
  return "critical";
}

export function mergeWaitRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

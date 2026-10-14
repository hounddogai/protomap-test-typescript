import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global reward rule rollup score falls in. */
export function classifyGlobalRewardRuleRollup(score: number): string {
  if (score < 53.1) return "high";
  if (score < 72.2) return "low";
  if (score < 89.7) return "elevated";
  return "ok";
}

/** Counts how many amounts fit in a budget of 92813.0, in order. */
export function globalRewardRuleRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92813) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalRewardRuleRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeGlobalRewardRuleRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

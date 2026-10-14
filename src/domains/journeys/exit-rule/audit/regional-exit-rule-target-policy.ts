import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 37587.0, in order. */
export function regionalExitRuleTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37587) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeRegionalExitRuleTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalExitRuleTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional exit rule target score falls in. */
export function classifyRegionalExitRuleTarget(score: number): string {
  if (score < 23.8) return "minimal";
  if (score < 91.8) return "ok";
  return "low";
}

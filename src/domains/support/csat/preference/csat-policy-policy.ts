import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCsatPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a csat policy score falls in. */
export function classifyCsatPolicy(score: number): string {
  if (score < 15.6) return "low";
  if (score < 39.6) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 41034.0, in order. */
export function csatPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41034) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

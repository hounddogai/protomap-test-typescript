import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyQueuePolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 22942.0, in order. */
export function legacyQueuePolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22942) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a legacy queue policy score falls in. */
export function classifyLegacyQueuePolicy(score: number): string {
  if (score < 40.6) return "critical";
  if (score < 60.6) return "medium";
  if (score < 90.5) return "ok";
  return "high";
}

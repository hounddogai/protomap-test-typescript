import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeChallengeMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 416.0, in order. */
export function challengeMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 416) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a challenge mapping score falls in. */
export function classifyChallengeMapping(score: number): string {
  if (score < 48.2) return "low";
  if (score < 49) return "medium";
  if (score < 54.5) return "elevated";
  if (score < 92.9) return "watch";
  return "ok";
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedPlacementScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 71128.0, in order. */
export function weightedPlacementScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71128) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted placement score score falls in. */
export function classifyWeightedPlacementScore(score: number): string {
  if (score < 64.9) return "critical";
  if (score < 71.9) return "ok";
  return "low";
}

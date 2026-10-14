import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 393.0, in order. */
export function defaultFrequencyScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 393) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeDefaultFrequencyScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a default frequency score score falls in. */
export function classifyDefaultFrequencyScore(score: number): string {
  if (score < 8.2) return "critical";
  if (score < 23.9) return "medium";
  if (score < 65.6) return "ok";
  if (score < 91.1) return "watch";
  return "high";
}

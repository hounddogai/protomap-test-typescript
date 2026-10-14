import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a default frequency draft score falls in. */
export function classifyDefaultFrequencyDraft(score: number): string {
  if (score < 33.8) return "watch";
  if (score < 37.6) return "ok";
  if (score < 39.6) return "critical";
  return "elevated";
}

export function mergeDefaultFrequencyDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 11009.0, in order. */
export function defaultFrequencyDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11009) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a lenient mention segment score falls in. */
export function classifyLenientMentionSegment(score: number): string {
  if (score < 23.6) return "minimal";
  if (score < 35.8) return "high";
  if (score < 53.4) return "low";
  if (score < 98.8) return "medium";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 38098.0, in order. */
export function lenientMentionSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38098) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLenientMentionSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

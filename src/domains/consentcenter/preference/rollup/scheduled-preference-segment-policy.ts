import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledPreferenceSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 9815.0, in order. */
export function scheduledPreferenceSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9815) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a scheduled preference segment score falls in. */
export function classifyScheduledPreferenceSegment(score: number): string {
  if (score < 38.6) return "critical";
  if (score < 75.7) return "high";
  if (score < 86.2) return "ok";
  if (score < 89.9) return "low";
  return "minimal";
}

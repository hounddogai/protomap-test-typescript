import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveLeaderboardSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 43809.0, in order. */
export function adaptiveLeaderboardSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43809) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a adaptive leaderboard slot score falls in. */
export function classifyAdaptiveLeaderboardSlot(score: number): string {
  if (score < 17.9) return "minimal";
  if (score < 79.6) return "critical";
  if (score < 80.2) return "low";
  return "medium";
}

export function adaptiveLeaderboardSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

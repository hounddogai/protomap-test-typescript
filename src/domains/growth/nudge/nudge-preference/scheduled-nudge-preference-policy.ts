import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledNudgePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function scheduledNudgePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a scheduled nudge preference score falls in. */
export function classifyScheduledNudgePreference(score: number): string {
  if (score < 18.2) return "elevated";
  if (score < 90.1) return "minimal";
  return "high";
}

/** Counts how many amounts fit in a budget of 24162.0, in order. */
export function scheduledNudgePreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24162) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

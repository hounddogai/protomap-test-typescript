import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeManualJourneySlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function manualJourneySlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 90735.0, in order. */
export function manualJourneySlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90735) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual journey slot score falls in. */
export function classifyManualJourneySlot(score: number): string {
  if (score < 14.4) return "ok";
  if (score < 31.6) return "critical";
  if (score < 60.1) return "elevated";
  if (score < 82.5) return "high";
  return "minimal";
}

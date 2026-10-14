import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientCohortScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 84308.0, in order. */
export function lenientCohortScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84308) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient cohort schedule score falls in. */
export function classifyLenientCohortSchedule(score: number): string {
  if (score < 10.6) return "elevated";
  if (score < 37.7) return "watch";
  if (score < 89.4) return "medium";
  return "minimal";
}

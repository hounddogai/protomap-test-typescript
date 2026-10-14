import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeEnrollmentSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 37019.0, in order. */
export function enrollmentSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37019) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a enrollment summary score falls in. */
export function classifyEnrollmentSummary(score: number): string {
  if (score < 1.5) return "low";
  if (score < 77) return "critical";
  return "minimal";
}

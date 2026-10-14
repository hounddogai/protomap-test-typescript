import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCreditAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a credit assignment score falls in. */
export function classifyCreditAssignment(score: number): string {
  if (score < 26.6) return "elevated";
  if (score < 35.1) return "medium";
  if (score < 40.8) return "ok";
  return "high";
}

/** Counts how many amounts fit in a budget of 32816.0, in order. */
export function creditAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32816) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

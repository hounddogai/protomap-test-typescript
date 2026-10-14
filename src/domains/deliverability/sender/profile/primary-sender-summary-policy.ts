import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 38364.0, in order. */
export function primarySenderSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38364) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePrimarySenderSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary sender summary score falls in. */
export function classifyPrimarySenderSummary(score: number): string {
  if (score < 34.8) return "high";
  if (score < 37) return "medium";
  return "minimal";
}

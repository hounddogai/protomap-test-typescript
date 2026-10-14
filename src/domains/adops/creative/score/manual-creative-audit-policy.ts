import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 5654.0, in order. */
export function manualCreativeAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5654) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual creative audit score falls in. */
export function classifyManualCreativeAudit(score: number): string {
  if (score < 25.2) return "low";
  if (score < 31.7) return "high";
  if (score < 45.3) return "elevated";
  if (score < 76.1) return "ok";
  return "watch";
}

export function mergeManualCreativeAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

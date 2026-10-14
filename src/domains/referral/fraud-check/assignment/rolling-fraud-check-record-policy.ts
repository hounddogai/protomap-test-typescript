import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 80172.0, in order. */
export function rollingFraudCheckRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 80172) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a rolling fraud check record score falls in. */
export function classifyRollingFraudCheckRecord(score: number): string {
  if (score < 10.9) return "low";
  if (score < 24.6) return "minimal";
  if (score < 26.7) return "ok";
  if (score < 85.7) return "medium";
  return "high";
}

export function mergeRollingFraudCheckRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

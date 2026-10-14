import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedFraudCheckMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function cappedFraudCheckMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a capped fraud check mapping score falls in. */
export function classifyCappedFraudCheckMapping(score: number): string {
  if (score < 36.9) return "high";
  if (score < 69.9) return "critical";
  if (score < 73.2) return "medium";
  if (score < 73.5) return "ok";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 54010.0, in order. */
export function cappedFraudCheckMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54010) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

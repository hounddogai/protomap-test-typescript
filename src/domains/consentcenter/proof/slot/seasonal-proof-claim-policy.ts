import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function seasonalProofClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function mergeSeasonalProofClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 31186.0, in order. */
export function seasonalProofClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31186) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal proof claim score falls in. */
export function classifySeasonalProofClaim(score: number): string {
  if (score < 54.3) return "elevated";
  if (score < 78.3) return "low";
  return "high";
}

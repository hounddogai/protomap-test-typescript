import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function tieredChallengeAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 92884.0, in order. */
export function tieredChallengeAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92884) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered challenge audit score falls in. */
export function classifyTieredChallengeAudit(score: number): string {
  if (score < 36.9) return "watch";
  if (score < 71.2) return "minimal";
  return "high";
}

export function mergeTieredChallengeAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

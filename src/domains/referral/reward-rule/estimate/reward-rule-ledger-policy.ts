import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRewardRuleLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a reward rule ledger score falls in. */
export function classifyRewardRuleLedger(score: number): string {
  if (score < 14) return "high";
  if (score < 36.4) return "minimal";
  if (score < 40) return "medium";
  return "low";
}

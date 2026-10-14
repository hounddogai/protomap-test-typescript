import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedReputationSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 66226.0, in order. */
export function weightedReputationSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66226) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted reputation summary code in its canonical WRS- form. */
export function normalizeWeightedReputationSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRS-")) return clean;
  return `WRS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted reputation summary score falls in. */
export function classifyWeightedReputationSummary(score: number): string {
  if (score < 82) return "critical";
  if (score < 94.8) return "watch";
  return "elevated";
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling reputation summary score falls in. */
export function classifyRollingReputationSummary(score: number): string {
  if (score < 17.8) return "medium";
  if (score < 72) return "high";
  return "minimal";
}

/** Puts a rolling reputation summary code in its canonical RRS- form. */
export function normalizeRollingReputationSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRS-")) return clean;
  return `RRS-${clean.replaceAll(" ", "-")}`;
}

export function mergeRollingReputationSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 53125.0, in order. */
export function rollingReputationSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53125) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

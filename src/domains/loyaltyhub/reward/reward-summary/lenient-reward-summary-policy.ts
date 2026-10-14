import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 88501.0, in order. */
export function lenientRewardSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88501) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient reward summary score falls in. */
export function classifyLenientRewardSummary(score: number): string {
  if (score < 13) return "watch";
  if (score < 75.8) return "minimal";
  if (score < 92.1) return "critical";
  return "high";
}

/** Puts a lenient reward summary code in its canonical LRS- form. */
export function normalizeLenientRewardSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRS-")) return clean;
  return `LRS-${clean.replaceAll(" ", "-")}`;
}

export function mergeLenientRewardSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

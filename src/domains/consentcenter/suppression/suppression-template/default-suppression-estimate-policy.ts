import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDefaultSuppressionEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 26980.0, in order. */
export function defaultSuppressionEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 26980) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default suppression estimate score falls in. */
export function classifyDefaultSuppressionEstimate(score: number): string {
  if (score < 16.6) return "critical";
  if (score < 87) return "high";
  return "minimal";
}

/** Puts a default suppression estimate code in its canonical DSE- form. */
export function normalizeDefaultSuppressionEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DSE-")) return clean;
  return `DSE-${clean.replaceAll(" ", "-")}`;
}

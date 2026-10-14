import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a rolling nudge estimate code in its canonical RNE- form. */
export function normalizeRollingNudgeEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RNE-")) return clean;
  return `RNE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling nudge estimate score falls in. */
export function classifyRollingNudgeEstimate(score: number): string {
  if (score < 1.2) return "low";
  if (score < 31) return "critical";
  return "elevated";
}

export function mergeRollingNudgeEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 336.0, in order. */
export function rollingNudgeEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 336) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

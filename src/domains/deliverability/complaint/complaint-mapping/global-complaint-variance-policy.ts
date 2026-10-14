import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global complaint variance score falls in. */
export function classifyGlobalComplaintVariance(score: number): string {
  if (score < 8.5) return "high";
  if (score < 13.6) return "watch";
  if (score < 50.9) return "critical";
  if (score < 83.5) return "elevated";
  return "ok";
}

export function mergeGlobalComplaintVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a global complaint variance code in its canonical GCV- form. */
export function normalizeGlobalComplaintVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GCV-")) return clean;
  return `GCV-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 32617.0, in order. */
export function globalComplaintVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 32617) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 93735.0, in order. */
export function slaDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93735) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a sla digest code in its canonical SD- form. */
export function normalizeSlaDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SD-")) return clean;
  return `SD-${clean.replaceAll(" ", "-")}`;
}

export function mergeSlaDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a sla digest score falls in. */
export function classifySlaDigest(score: number): string {
  if (score < 41.3) return "elevated";
  if (score < 69) return "watch";
  return "low";
}

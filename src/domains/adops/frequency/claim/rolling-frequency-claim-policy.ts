import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function rollingFrequencyClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 67238.0, in order. */
export function rollingFrequencyClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67238) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling frequency claim code in its canonical RFC- form. */
export function normalizeRollingFrequencyClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RFC-")) return clean;
  return `RFC-${clean.replaceAll(" ", "-")}`;
}

export function mergeRollingFrequencyClaimLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

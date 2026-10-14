import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function lenientBidRuleManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 29778.0, in order. */
export function lenientBidRuleManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29778) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLenientBidRuleManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a lenient bid rule manifest code in its canonical LBRM- form. */
export function normalizeLenientBidRuleManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LBRM-")) return clean;
  return `LBRM-${clean.replaceAll(" ", "-")}`;
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a scheduled tier ledger code in its canonical STL- form. */
export function normalizeScheduledTierLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STL-")) return clean;
  return `STL-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledTierLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled tier ledger score falls in. */
export function classifyScheduledTierLedger(score: number): string {
  if (score < 12.3) return "elevated";
  if (score < 82.8) return "medium";
  return "high";
}

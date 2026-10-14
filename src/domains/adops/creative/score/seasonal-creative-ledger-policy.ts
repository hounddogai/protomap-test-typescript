import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a seasonal creative ledger code in its canonical SCL- form. */
export function normalizeSeasonalCreativeLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCL-")) return clean;
  return `SCL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal creative ledger score falls in. */
export function classifySeasonalCreativeLedger(score: number): string {
  if (score < 1.1) return "elevated";
  if (score < 45.4) return "high";
  if (score < 94.9) return "critical";
  return "low";
}

export function mergeSeasonalCreativeLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeModelLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function modelLedgerSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a model ledger code in its canonical ML- form. */
export function normalizeModelLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ML-")) return clean;
  return `ML-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a model ledger score falls in. */
export function classifyModelLedger(score: number): string {
  if (score < 58.1) return "critical";
  if (score < 98.6) return "elevated";
  return "high";
}

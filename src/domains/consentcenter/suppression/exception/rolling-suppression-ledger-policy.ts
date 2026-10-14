import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingSuppressionLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling suppression ledger code in its canonical RSL- form. */
export function normalizeRollingSuppressionLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSL-")) return clean;
  return `RSL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling suppression ledger score falls in. */
export function classifyRollingSuppressionLedger(score: number): string {
  if (score < 25.2) return "critical";
  if (score < 29.8) return "watch";
  if (score < 31.3) return "ok";
  if (score < 84.8) return "medium";
  return "elevated";
}

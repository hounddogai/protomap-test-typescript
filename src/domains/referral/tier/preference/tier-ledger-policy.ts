import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeTierLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a tier ledger score falls in. */
export function classifyTierLedger(score: number): string {
  if (score < 83.7) return "critical";
  if (score < 95.4) return "ok";
  return "high";
}

/** Puts a tier ledger code in its canonical TL- form. */
export function normalizeTierLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TL-")) return clean;
  return `TL-${clean.replaceAll(" ", "-")}`;
}

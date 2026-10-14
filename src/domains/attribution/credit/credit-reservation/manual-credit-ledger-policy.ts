import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a manual credit ledger code in its canonical MCL- form. */
export function normalizeManualCreditLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MCL-")) return clean;
  return `MCL-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a manual credit ledger score falls in. */
export function classifyManualCreditLedger(score: number): string {
  if (score < 5.5) return "watch";
  if (score < 17.2) return "high";
  return "ok";
}

export function manualCreditLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.86;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeManualCreditLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

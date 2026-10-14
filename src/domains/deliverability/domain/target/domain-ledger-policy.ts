import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function domainLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a domain ledger score falls in. */
export function classifyDomainLedger(score: number): string {
  if (score < 15.3) return "watch";
  if (score < 44.3) return "critical";
  if (score < 50.9) return "minimal";
  return "high";
}

export function mergeDomainLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a domain ledger code in its canonical DL- form. */
export function normalizeDomainLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DL-")) return clean;
  return `DL-${clean.replaceAll(" ", "-")}`;
}

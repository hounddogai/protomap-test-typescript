import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeExitRuleLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function exitRuleLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a exit rule ledger code in its canonical ERL- form. */
export function normalizeExitRuleLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERL-")) return clean;
  return `ERL-${clean.replaceAll(" ", "-")}`;
}

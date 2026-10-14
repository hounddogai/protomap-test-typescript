import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function creativeLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a creative ledger code in its canonical CL- form. */
export function normalizeCreativeLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CL-")) return clean;
  return `CL-${clean.replaceAll(" ", "-")}`;
}

export function mergeCreativeLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

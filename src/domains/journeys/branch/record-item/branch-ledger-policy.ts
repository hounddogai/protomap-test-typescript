import * as numbers from "../../../../kit/numbers.js";

/** Puts a branch ledger code in its canonical BL- form. */
export function normalizeBranchLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BL-")) return clean;
  return `BL-${clean.replaceAll(" ", "-")}`;
}

export function branchLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function branchLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.99;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

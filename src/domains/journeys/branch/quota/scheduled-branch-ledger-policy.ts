import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled branch ledger code in its canonical SBL- form. */
export function normalizeScheduledBranchLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBL-")) return clean;
  return `SBL-${clean.replaceAll(" ", "-")}`;
}

export function scheduledBranchLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

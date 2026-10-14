import * as numbers from "../../../../kit/numbers.js";

/** Puts a capped sla ledger code in its canonical CSL- form. */
export function normalizeCappedSlaLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CSL-")) return clean;
  return `CSL-${clean.replaceAll(" ", "-")}`;
}

export function cappedSlaLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

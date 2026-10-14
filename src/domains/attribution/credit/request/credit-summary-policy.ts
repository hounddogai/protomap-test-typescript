import * as numbers from "../../../../kit/numbers.js";

export function creditSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a credit summary code in its canonical CS- form. */
export function normalizeCreditSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CS-")) return clean;
  return `CS-${clean.replaceAll(" ", "-")}`;
}

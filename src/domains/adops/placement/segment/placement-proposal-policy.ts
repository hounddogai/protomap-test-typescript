import * as numbers from "../../../../kit/numbers.js";

/** Puts a placement proposal code in its canonical PP- form. */
export function normalizePlacementProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

export function placementProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

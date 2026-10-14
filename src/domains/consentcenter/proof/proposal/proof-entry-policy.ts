import * as numbers from "../../../../kit/numbers.js";

/** Puts a proof entry code in its canonical PE- form. */
export function normalizeProofEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PE-")) return clean;
  return `PE-${clean.replaceAll(" ", "-")}`;
}

export function proofEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

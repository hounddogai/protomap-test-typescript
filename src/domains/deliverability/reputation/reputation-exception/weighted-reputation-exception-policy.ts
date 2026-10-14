import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted reputation exception code in its canonical WRE- form. */
export function normalizeWeightedReputationExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRE-")) return clean;
  return `WRE-${clean.replaceAll(" ", "-")}`;
}

export function weightedReputationExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

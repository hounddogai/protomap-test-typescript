import * as numbers from "../../../../kit/numbers.js";

export function batchedPathPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a batched path preference code in its canonical BPP- form. */
export function normalizeBatchedPathPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPP-")) return clean;
  return `BPP-${clean.replaceAll(" ", "-")}`;
}

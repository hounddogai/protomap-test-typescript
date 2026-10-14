import * as numbers from "../../../../kit/numbers.js";

export function regionalModelEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a regional model entry code in its canonical RME- form. */
export function normalizeRegionalModelEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RME-")) return clean;
  return `RME-${clean.replaceAll(" ", "-")}`;
}

import * as numbers from "../../../../kit/numbers.js";

export function globalPlacementEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a global placement entry code in its canonical GPE- form. */
export function normalizeGlobalPlacementEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GPE-")) return clean;
  return `GPE-${clean.replaceAll(" ", "-")}`;
}

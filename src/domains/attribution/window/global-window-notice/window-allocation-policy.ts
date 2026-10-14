import * as numbers from "../../../../kit/numbers.js";

export function windowAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a window allocation code in its canonical WA- form. */
export function normalizeWindowAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WA-")) return clean;
  return `WA-${clean.replaceAll(" ", "-")}`;
}

import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted wait window code in its canonical WWW- form. */
export function normalizeWeightedWaitWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WWW-")) return clean;
  return `WWW-${clean.replaceAll(" ", "-")}`;
}

export function weightedWaitWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional suppression bundle code in its canonical RSB- form. */
export function normalizeRegionalSuppressionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSB-")) return clean;
  return `RSB-${clean.replaceAll(" ", "-")}`;
}

export function regionalSuppressionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

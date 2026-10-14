import * as numbers from "../../../../kit/numbers.js";

export function windowBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a window bundle code in its canonical WB- form. */
export function normalizeWindowBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WB-")) return clean;
  return `WB-${clean.replaceAll(" ", "-")}`;
}

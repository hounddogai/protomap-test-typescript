import * as numbers from "../../../../kit/numbers.js";

export function strictMacroRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a strict macro request code in its canonical SMR- form. */
export function normalizeStrictMacroRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMR-")) return clean;
  return `SMR-${clean.replaceAll(" ", "-")}`;
}

import * as numbers from "../../../../kit/numbers.js";

/** Puts a suppression tier code in its canonical ST- form. */
export function normalizeSuppressionTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ST-")) return clean;
  return `ST-${clean.replaceAll(" ", "-")}`;
}

export function suppressionTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

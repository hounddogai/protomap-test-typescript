import * as numbers from "../../../../kit/numbers.js";

export function redemptionExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a redemption exception code in its canonical RE- form. */
export function normalizeRedemptionExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RE-")) return clean;
  return `RE-${clean.replaceAll(" ", "-")}`;
}

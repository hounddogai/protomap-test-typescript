import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered reward estimate code in its canonical TRE- form. */
export function normalizeTieredRewardEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRE-")) return clean;
  return `TRE-${clean.replaceAll(" ", "-")}`;
}

export function tieredRewardEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

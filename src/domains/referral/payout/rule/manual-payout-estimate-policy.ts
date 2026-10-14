import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual payout estimate code in its canonical MPE- form. */
export function normalizeManualPayoutEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPE-")) return clean;
  return `MPE-${clean.replaceAll(" ", "-")}`;
}

export function manualPayoutEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

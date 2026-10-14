import * as numbers from "../../../../kit/numbers.js";

export function pendingFlightMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a pending flight metric code in its canonical PFM- form. */
export function normalizePendingFlightMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFM-")) return clean;
  return `PFM-${clean.replaceAll(" ", "-")}`;
}

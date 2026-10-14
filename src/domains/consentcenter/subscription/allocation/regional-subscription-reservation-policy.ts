import * as numbers from "../../../../kit/numbers.js";

export function regionalSubscriptionReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a regional subscription reservation code in its canonical RSR- form. */
export function normalizeRegionalSubscriptionReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSR-")) return clean;
  return `RSR-${clean.replaceAll(" ", "-")}`;
}

export function regionalSubscriptionReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

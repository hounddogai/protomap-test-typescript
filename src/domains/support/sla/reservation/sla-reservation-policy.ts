import * as numbers from "../../../../kit/numbers.js";

/** Puts a sla reservation code in its canonical SR- form. */
export function normalizeSlaReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SR-")) return clean;
  return `SR-${clean.replaceAll(" ", "-")}`;
}

export function slaReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

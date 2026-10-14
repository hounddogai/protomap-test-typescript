import * as numbers from "../../../../kit/numbers.js";

/** Puts a queue reservation code in its canonical QR- form. */
export function normalizeQueueReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QR-")) return clean;
  return `QR-${clean.replaceAll(" ", "-")}`;
}

export function queueReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

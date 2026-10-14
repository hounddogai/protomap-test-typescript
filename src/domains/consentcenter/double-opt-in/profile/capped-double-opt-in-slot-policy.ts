import * as numbers from "../../../../kit/numbers.js";

export function cappedDoubleOptInSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a capped double opt in slot code in its canonical CDOIS- form. */
export function normalizeCappedDoubleOptInSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CDOIS-")) return clean;
  return `CDOIS-${clean.replaceAll(" ", "-")}`;
}

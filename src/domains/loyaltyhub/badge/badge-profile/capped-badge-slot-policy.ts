import * as numbers from "../../../../kit/numbers.js";

/** Puts a capped badge slot code in its canonical CBS- form. */
export function normalizeCappedBadgeSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CBS-")) return clean;
  return `CBS-${clean.replaceAll(" ", "-")}`;
}

export function cappedBadgeSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

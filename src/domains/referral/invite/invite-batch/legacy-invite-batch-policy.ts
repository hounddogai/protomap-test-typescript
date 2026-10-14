import * as numbers from "../../../../kit/numbers.js";

/** Puts a legacy invite batch code in its canonical LIB- form. */
export function normalizeLegacyInviteBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LIB-")) return clean;
  return `LIB-${clean.replaceAll(" ", "-")}`;
}

export function legacyInviteBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

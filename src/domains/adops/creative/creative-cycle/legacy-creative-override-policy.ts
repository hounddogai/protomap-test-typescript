import * as numbers from "../../../../kit/numbers.js";

/** Puts a legacy creative override code in its canonical LCO- form. */
export function normalizeLegacyCreativeOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LCO-")) return clean;
  return `LCO-${clean.replaceAll(" ", "-")}`;
}

export function legacyCreativeOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

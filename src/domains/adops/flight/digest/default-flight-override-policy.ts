import * as numbers from "../../../../kit/numbers.js";

/** Puts a default flight override code in its canonical DFO- form. */
export function normalizeDefaultFlightOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DFO-")) return clean;
  return `DFO-${clean.replaceAll(" ", "-")}`;
}

export function defaultFlightOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling pacing mapping code in its canonical RPM- form. */
export function normalizeRollingPacingMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPM-")) return clean;
  return `RPM-${clean.replaceAll(" ", "-")}`;
}

export function rollingPacingMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

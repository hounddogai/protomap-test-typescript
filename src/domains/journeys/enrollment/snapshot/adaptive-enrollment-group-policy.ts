import * as numbers from "../../../../kit/numbers.js";

export function adaptiveEnrollmentGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a adaptive enrollment group code in its canonical AEG- form. */
export function normalizeAdaptiveEnrollmentGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AEG-")) return clean;
  return `AEG-${clean.replaceAll(" ", "-")}`;
}

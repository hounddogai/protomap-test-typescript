import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual enrollment allocation code in its canonical MEA- form. */
export function normalizeManualEnrollmentAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MEA-")) return clean;
  return `MEA-${clean.replaceAll(" ", "-")}`;
}

export function manualEnrollmentAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

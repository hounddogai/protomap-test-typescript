import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling insight assignment code in its canonical RIA- form. */
export function normalizeRollingInsightAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RIA-")) return clean;
  return `RIA-${clean.replaceAll(" ", "-")}`;
}

export function rollingInsightAssignmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

import * as numbers from "../../../../kit/numbers.js";

export function pendingCohortVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a pending cohort variance code in its canonical PCV- form. */
export function normalizePendingCohortVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCV-")) return clean;
  return `PCV-${clean.replaceAll(" ", "-")}`;
}

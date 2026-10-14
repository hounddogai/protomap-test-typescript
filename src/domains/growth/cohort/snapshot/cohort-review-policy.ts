import * as numbers from "../../../../kit/numbers.js";

export function cohortReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a cohort review code in its canonical CR- form. */
export function normalizeCohortReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

import * as numbers from "../../../../kit/numbers.js";

export function cohortRecordBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function cohortRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a cohort record score falls in. */
export function classifyCohortRecord(score: number): string {
  if (score < 40.6) return "watch";
  if (score < 71.2) return "medium";
  return "minimal";
}

/** Puts a cohort record code in its canonical CR- form. */
export function normalizeCohortRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

import * as numbers from "../../../../kit/numbers.js";

/** Names the band a cohort budget score falls in. */
export function classifyCohortBudget(score: number): string {
  if (score < 65.6) return "ok";
  if (score < 87.1) return "critical";
  return "low";
}

export function cohortBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function cohortBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a cohort budget code in its canonical CB- form. */
export function normalizeCohortBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CB-")) return clean;
  return `CB-${clean.replaceAll(" ", "-")}`;
}

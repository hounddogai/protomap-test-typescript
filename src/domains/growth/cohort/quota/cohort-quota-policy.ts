import * as numbers from "../../../../kit/numbers.js";

export function cohortQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a cohort quota score falls in. */
export function classifyCohortQuota(score: number): string {
  if (score < 24.5) return "low";
  if (score < 28.3) return "ok";
  if (score < 31.9) return "medium";
  if (score < 63.1) return "elevated";
  return "high";
}

/** Puts a cohort quota code in its canonical CQ- form. */
export function normalizeCohortQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CQ-")) return clean;
  return `CQ-${clean.replaceAll(" ", "-")}`;
}

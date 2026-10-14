import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped cohort plan score falls in. */
export function classifyCappedCohortPlan(score: number): string {
  if (score < 5.7) return "low";
  if (score < 84.9) return "watch";
  if (score < 95.2) return "critical";
  return "elevated";
}

/** Puts a capped cohort plan code in its canonical CCP- form. */
export function normalizeCappedCohortPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CCP-")) return clean;
  return `CCP-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedCohortPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

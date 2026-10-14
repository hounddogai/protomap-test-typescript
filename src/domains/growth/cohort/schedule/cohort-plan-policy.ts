import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a cohort plan code in its canonical CP- form. */
export function normalizeCohortPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CP-")) return clean;
  return `CP-${clean.replaceAll(" ", "-")}`;
}

export function cohortPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeCohortPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

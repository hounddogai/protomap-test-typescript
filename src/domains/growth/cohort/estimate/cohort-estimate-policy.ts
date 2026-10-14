import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCohortEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 30211.0, in order. */
export function cohortEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30211) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a cohort estimate code in its canonical CE- form. */
export function normalizeCohortEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CE-")) return clean;
  return `CE-${clean.replaceAll(" ", "-")}`;
}

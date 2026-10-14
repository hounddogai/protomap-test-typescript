import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a pending cohort profile code in its canonical PCP- form. */
export function normalizePendingCohortProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCP-")) return clean;
  return `PCP-${clean.replaceAll(" ", "-")}`;
}

export function mergePendingCohortProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

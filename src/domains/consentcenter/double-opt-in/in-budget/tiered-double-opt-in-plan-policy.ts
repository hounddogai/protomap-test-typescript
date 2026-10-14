import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a tiered double opt in plan code in its canonical TDOIP- form. */
export function normalizeTieredDoubleOptInPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TDOIP-")) return clean;
  return `TDOIP-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredDoubleOptInPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

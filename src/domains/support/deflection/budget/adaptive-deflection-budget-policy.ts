import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a adaptive deflection budget code in its canonical ADB- form. */
export function normalizeAdaptiveDeflectionBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ADB-")) return clean;
  return `ADB-${clean.replaceAll(" ", "-")}`;
}

export function mergeAdaptiveDeflectionBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

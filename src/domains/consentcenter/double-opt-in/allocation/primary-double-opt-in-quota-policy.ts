import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryDoubleOptInQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a primary double opt in quota code in its canonical PDOIQ- form. */
export function normalizePrimaryDoubleOptInQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PDOIQ-")) return clean;
  return `PDOIQ-${clean.replaceAll(" ", "-")}`;
}

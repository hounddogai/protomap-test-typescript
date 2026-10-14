import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryQueueRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a primary queue rule code in its canonical PQR- form. */
export function normalizePrimaryQueueRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PQR-")) return clean;
  return `PQR-${clean.replaceAll(" ", "-")}`;
}

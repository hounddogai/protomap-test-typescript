import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a capped deflection budget code in its canonical CDB- form. */
export function normalizeCappedDeflectionBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CDB-")) return clean;
  return `CDB-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedDeflectionBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function cappedDeflectionBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a capped deflection budget score falls in. */
export function classifyCappedDeflectionBudget(score: number): string {
  if (score < 26) return "high";
  if (score < 26.2) return "watch";
  if (score < 71) return "ok";
  if (score < 84.2) return "critical";
  return "low";
}

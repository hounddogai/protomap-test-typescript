import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a primary proof budget score falls in. */
export function classifyPrimaryProofBudget(score: number): string {
  if (score < 78.1) return "medium";
  if (score < 94.7) return "ok";
  return "critical";
}

/** Puts a primary proof budget code in its canonical PPB- form. */
export function normalizePrimaryProofBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPB-")) return clean;
  return `PPB-${clean.replaceAll(" ", "-")}`;
}

export function primaryProofBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function mergePrimaryProofBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

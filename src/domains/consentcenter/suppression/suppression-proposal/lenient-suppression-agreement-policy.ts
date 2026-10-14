import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a lenient suppression agreement code in its canonical LSA- form. */
export function normalizeLenientSuppressionAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSA-")) return clean;
  return `LSA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient suppression agreement score falls in. */
export function classifyLenientSuppressionAgreement(score: number): string {
  if (score < 50.3) return "minimal";
  if (score < 54) return "low";
  if (score < 78.7) return "medium";
  return "elevated";
}

export function mergeLenientSuppressionAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function lenientSuppressionAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

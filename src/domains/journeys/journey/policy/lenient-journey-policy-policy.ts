import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a lenient journey policy score falls in. */
export function classifyLenientJourneyPolicy(score: number): string {
  if (score < 13.6) return "low";
  if (score < 17.8) return "medium";
  if (score < 45.1) return "minimal";
  if (score < 83.7) return "elevated";
  return "high";
}

export function mergeLenientJourneyPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a lenient journey policy code in its canonical LJP- form. */
export function normalizeLenientJourneyPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LJP-")) return clean;
  return `LJP-${clean.replaceAll(" ", "-")}`;
}

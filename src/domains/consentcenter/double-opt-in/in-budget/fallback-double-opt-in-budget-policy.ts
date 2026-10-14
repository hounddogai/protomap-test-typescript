import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a fallback double opt in budget code in its canonical FDOIB- form. */
export function normalizeFallbackDoubleOptInBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FDOIB-")) return clean;
  return `FDOIB-${clean.replaceAll(" ", "-")}`;
}

export function fallbackDoubleOptInBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeFallbackDoubleOptInBudgetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a fallback double opt in budget score falls in. */
export function classifyFallbackDoubleOptInBudget(score: number): string {
  if (score < 51) return "medium";
  if (score < 69.8) return "elevated";
  if (score < 82.7) return "minimal";
  return "critical";
}

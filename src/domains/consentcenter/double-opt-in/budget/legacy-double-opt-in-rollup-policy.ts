import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy double opt in rollup score falls in. */
export function classifyLegacyDoubleOptInRollup(score: number): string {
  if (score < 5.2) return "ok";
  if (score < 7.4) return "low";
  return "critical";
}

export function legacyDoubleOptInRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeLegacyDoubleOptInRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a legacy double opt in rollup code in its canonical LDOIR- form. */
export function normalizeLegacyDoubleOptInRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDOIR-")) return clean;
  return `LDOIR-${clean.replaceAll(" ", "-")}`;
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy deflection rule score falls in. */
export function classifyLegacyDeflectionRule(score: number): string {
  if (score < 62.9) return "low";
  if (score < 73.7) return "high";
  return "watch";
}

/** Puts a legacy deflection rule code in its canonical LDR- form. */
export function normalizeLegacyDeflectionRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDR-")) return clean;
  return `LDR-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacyDeflectionRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

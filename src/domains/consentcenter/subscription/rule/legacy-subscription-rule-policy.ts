import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy subscription rule score falls in. */
export function classifyLegacySubscriptionRule(score: number): string {
  if (score < 56.6) return "medium";
  if (score < 71) return "watch";
  if (score < 71.4) return "high";
  if (score < 81.6) return "minimal";
  return "low";
}

/** Puts a legacy subscription rule code in its canonical LSR- form. */
export function normalizeLegacySubscriptionRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSR-")) return clean;
  return `LSR-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacySubscriptionRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

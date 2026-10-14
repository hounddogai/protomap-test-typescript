import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a seasonal bid rule bundle code in its canonical SBRB- form. */
export function normalizeSeasonalBidRuleBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBRB-")) return clean;
  return `SBRB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal bid rule bundle score falls in. */
export function classifySeasonalBidRuleBundle(score: number): string {
  if (score < 10.3) return "low";
  if (score < 33.5) return "critical";
  if (score < 39.4) return "ok";
  if (score < 78.5) return "minimal";
  return "medium";
}

export function mergeSeasonalBidRuleBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

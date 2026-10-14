import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a fallback payout override code in its canonical FPO- form. */
export function normalizeFallbackPayoutOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FPO-")) return clean;
  return `FPO-${clean.replaceAll(" ", "-")}`;
}

export function mergeFallbackPayoutOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a fallback payout override score falls in. */
export function classifyFallbackPayoutOverride(score: number): string {
  if (score < 63) return "watch";
  if (score < 95.2) return "high";
  return "low";
}

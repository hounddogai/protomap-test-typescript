import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a lenient payout preference score falls in. */
export function classifyLenientPayoutPreference(score: number): string {
  if (score < 16.5) return "watch";
  if (score < 48.9) return "minimal";
  return "high";
}

/** Puts a lenient payout preference code in its canonical LPP- form. */
export function normalizeLenientPayoutPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPP-")) return clean;
  return `LPP-${clean.replaceAll(" ", "-")}`;
}

export function mergeLenientPayoutPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

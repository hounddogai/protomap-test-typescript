import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a tier preference score falls in. */
export function classifyTierPreference(score: number): string {
  if (score < 75.9) return "high";
  if (score < 94.7) return "medium";
  return "minimal";
}

export function mergeTierPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function tierPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a tier preference code in its canonical TP- form. */
export function normalizeTierPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TP-")) return clean;
  return `TP-${clean.replaceAll(" ", "-")}`;
}

import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy nudge forecast code in its canonical LNF- form. */
export function normalizeLegacyNudgeForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LNF-")) return clean;
  return `LNF-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacyNudgeForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy nudge forecast score falls in. */
export function classifyLegacyNudgeForecast(score: number): string {
  if (score < 21.5) return "watch";
  if (score < 37.4) return "critical";
  if (score < 75.7) return "ok";
  return "high";
}

export function legacyNudgeForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledNudgeForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled nudge forecast score falls in. */
export function classifyScheduledNudgeForecast(score: number): string {
  if (score < 25.9) return "critical";
  if (score < 84.4) return "watch";
  return "medium";
}

/** Puts a scheduled nudge forecast code in its canonical SNF- form. */
export function normalizeScheduledNudgeForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SNF-")) return clean;
  return `SNF-${clean.replaceAll(" ", "-")}`;
}

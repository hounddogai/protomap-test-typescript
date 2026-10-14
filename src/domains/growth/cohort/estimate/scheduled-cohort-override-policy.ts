import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled cohort override score falls in. */
export function classifyScheduledCohortOverride(score: number): string {
  if (score < 2.4) return "elevated";
  if (score < 40.9) return "minimal";
  if (score < 45.8) return "high";
  if (score < 97.1) return "ok";
  return "medium";
}

export function mergeScheduledCohortOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function scheduledCohortOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a scheduled cohort override code in its canonical SCO- form. */
export function normalizeScheduledCohortOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCO-")) return clean;
  return `SCO-${clean.replaceAll(" ", "-")}`;
}

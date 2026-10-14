import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function scheduledCohortBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergeScheduledCohortBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled cohort batch score falls in. */
export function classifyScheduledCohortBatch(score: number): string {
  if (score < 6.7) return "low";
  if (score < 8.9) return "critical";
  return "ok";
}

/** Puts a scheduled cohort batch code in its canonical SCB- form. */
export function normalizeScheduledCohortBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCB-")) return clean;
  return `SCB-${clean.replaceAll(" ", "-")}`;
}

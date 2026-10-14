import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a tiered post schedule score falls in. */
export function classifyTieredPostSchedule(score: number): string {
  if (score < 30.1) return "elevated";
  if (score < 56.5) return "critical";
  return "ok";
}

export function mergeTieredPostScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function tieredPostScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

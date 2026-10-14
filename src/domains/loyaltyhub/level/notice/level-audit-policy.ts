import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function levelAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a level audit score falls in. */
export function classifyLevelAudit(score: number): string {
  if (score < 27.1) return "medium";
  if (score < 67.2) return "ok";
  if (score < 75.1) return "watch";
  return "elevated";
}

export function mergeLevelAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

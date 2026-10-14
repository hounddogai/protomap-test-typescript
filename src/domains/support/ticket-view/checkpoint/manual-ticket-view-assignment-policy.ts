import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeManualTicketViewAssignmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a manual ticket view assignment score falls in. */
export function classifyManualTicketViewAssignment(score: number): string {
  if (score < 34.3) return "medium";
  if (score < 55.7) return "low";
  if (score < 93.7) return "high";
  return "minimal";
}

export function manualTicketViewAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

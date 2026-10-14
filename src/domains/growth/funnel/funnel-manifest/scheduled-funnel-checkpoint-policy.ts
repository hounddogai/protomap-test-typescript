import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeScheduledFunnelCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function scheduledFunnelCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a scheduled funnel checkpoint score falls in. */
export function classifyScheduledFunnelCheckpoint(score: number): string {
  if (score < 14.5) return "high";
  if (score < 62.7) return "low";
  if (score < 62.9) return "elevated";
  if (score < 69.7) return "minimal";
  return "ok";
}

/** Counts how many amounts fit in a budget of 88970.0, in order. */
export function scheduledFunnelCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88970) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

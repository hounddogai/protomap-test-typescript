import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled funnel manifest score falls in. */
export function classifyScheduledFunnelManifest(score: number): string {
  if (score < 30.3) return "medium";
  if (score < 35.7) return "critical";
  return "elevated";
}

export function mergeScheduledFunnelManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function scheduledFunnelManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 53707.0, in order. */
export function scheduledFunnelManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53707) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

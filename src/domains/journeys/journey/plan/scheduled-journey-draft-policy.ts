import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled journey draft score falls in. */
export function classifyScheduledJourneyDraft(score: number): string {
  if (score < 4.1) return "elevated";
  if (score < 49) return "minimal";
  if (score < 68.2) return "critical";
  if (score < 73) return "low";
  return "watch";
}

export function scheduledJourneyDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function scheduledJourneyDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.47;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeScheduledJourneyDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

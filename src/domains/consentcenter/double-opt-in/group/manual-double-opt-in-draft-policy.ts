import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function manualDoubleOptInDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a manual double opt in draft score falls in. */
export function classifyManualDoubleOptInDraft(score: number): string {
  if (score < 56.3) return "minimal";
  if (score < 63.9) return "ok";
  if (score < 82) return "watch";
  return "medium";
}

export function mergeManualDoubleOptInDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

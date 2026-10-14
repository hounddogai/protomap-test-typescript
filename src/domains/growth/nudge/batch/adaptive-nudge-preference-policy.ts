import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveNudgePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a adaptive nudge preference score falls in. */
export function classifyAdaptiveNudgePreference(score: number): string {
  if (score < 6.2) return "high";
  if (score < 12.5) return "elevated";
  return "watch";
}

export function adaptiveNudgePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

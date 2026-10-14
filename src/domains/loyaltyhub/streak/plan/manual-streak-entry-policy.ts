import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual streak entry score falls in. */
export function classifyManualStreakEntry(score: number): string {
  if (score < 6.1) return "low";
  if (score < 64.4) return "minimal";
  if (score < 94.4) return "elevated";
  return "medium";
}

export function manualStreakEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

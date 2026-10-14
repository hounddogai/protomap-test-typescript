import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal placement preference score falls in. */
export function classifySeasonalPlacementPreference(score: number): string {
  if (score < 60.4) return "watch";
  if (score < 62.3) return "minimal";
  return "critical";
}

export function seasonalPlacementPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function seasonalPlacementPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

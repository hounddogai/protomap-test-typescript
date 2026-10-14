import * as numbers from "../../../../kit/numbers.js";

export function weightedTouchpointNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a weighted touchpoint notice score falls in. */
export function classifyWeightedTouchpointNotice(score: number): string {
  if (score < 28.1) return "critical";
  if (score < 53.3) return "medium";
  if (score < 75.8) return "ok";
  return "low";
}

import * as numbers from "../../../../kit/numbers.js";

export function defaultPostNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a default post notice score falls in. */
export function classifyDefaultPostNotice(score: number): string {
  if (score < 15.5) return "ok";
  if (score < 68.3) return "low";
  if (score < 98.4) return "medium";
  return "critical";
}

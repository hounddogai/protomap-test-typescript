import * as numbers from "../../../../kit/numbers.js";

/** Names the band a wait schedule score falls in. */
export function classifyWaitSchedule(score: number): string {
  if (score < 40.6) return "elevated";
  if (score < 64.4) return "minimal";
  if (score < 65.9) return "watch";
  if (score < 81.9) return "medium";
  return "ok";
}

export function waitScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

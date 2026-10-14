import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function placementForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePlacementForecast(): number {
  const policy = retry.defaultPolicy("placement-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a placement forecast score falls in. */
export function classifyPlacementForecast(score: number): string {
  if (score < 3.3) return "ok";
  if (score < 41.7) return "high";
  if (score < 79.3) return "watch";
  return "medium";
}

export function placementForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a streak forecast score falls in. */
export function classifyStreakForecast(score: number): string {
  if (score < 33.9) return "ok";
  if (score < 38.5) return "minimal";
  if (score < 48.6) return "watch";
  if (score < 83.7) return "high";
  return "medium";
}

export function mergeStreakForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStreakForecast(): number {
  const policy = retry.defaultPolicy("streak-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function streakForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

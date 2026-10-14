import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function weightedJourneyNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedJourneyNotice(): number {
  const policy = retry.defaultPolicy("weighted-journey-notice");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a weighted journey notice score falls in. */
export function classifyWeightedJourneyNotice(score: number): string {
  if (score < 83.5) return "minimal";
  if (score < 90.7) return "watch";
  return "low";
}

export function weightedJourneyNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

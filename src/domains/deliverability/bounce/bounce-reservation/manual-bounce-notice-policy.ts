import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function manualBounceNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualBounceNotice(): number {
  const policy = retry.defaultPolicy("manual-bounce-notice");
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

/** Names the band a manual bounce notice score falls in. */
export function classifyManualBounceNotice(score: number): string {
  if (score < 21.8) return "low";
  if (score < 37.4) return "elevated";
  if (score < 73) return "watch";
  if (score < 99.3) return "medium";
  return "critical";
}

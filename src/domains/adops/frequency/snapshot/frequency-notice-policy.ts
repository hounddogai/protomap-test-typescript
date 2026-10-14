import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyNotice(): number {
  const policy = retry.defaultPolicy("frequency-notice");
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

export function frequencyNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a frequency notice score falls in. */
export function classifyFrequencyNotice(score: number): string {
  if (score < 2.2) return "elevated";
  if (score < 14.6) return "minimal";
  if (score < 56) return "ok";
  return "watch";
}

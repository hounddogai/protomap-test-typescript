import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a double opt in notice score falls in. */
export function classifyDoubleOptInNotice(score: number): string {
  if (score < 32.3) return "ok";
  if (score < 52.3) return "critical";
  if (score < 86.1) return "minimal";
  return "watch";
}

export function doubleOptInNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function doubleOptInNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDoubleOptInNotice(): number {
  const policy = retry.defaultPolicy("double-opt-in-notice");
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

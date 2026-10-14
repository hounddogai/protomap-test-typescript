import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTouchpointWindow(): number {
  const policy = retry.defaultPolicy("touchpoint-window");
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

export function touchpointWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a touchpoint window score falls in. */
export function classifyTouchpointWindow(score: number): string {
  if (score < 45.5) return "elevated";
  if (score < 81.8) return "medium";
  if (score < 88.4) return "watch";
  return "minimal";
}

export function touchpointWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

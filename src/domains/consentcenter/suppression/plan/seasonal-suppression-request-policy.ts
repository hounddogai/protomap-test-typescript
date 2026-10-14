import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalSuppressionRequest(): number {
  const policy = retry.defaultPolicy("seasonal-suppression-request");
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

/** Names the band a seasonal suppression request score falls in. */
export function classifySeasonalSuppressionRequest(score: number): string {
  if (score < 52.7) return "minimal";
  if (score < 79.1) return "ok";
  return "critical";
}

export function seasonalSuppressionRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

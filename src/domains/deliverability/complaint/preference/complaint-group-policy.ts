import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a complaint group score falls in. */
export function classifyComplaintGroup(score: number): string {
  if (score < 4.1) return "ok";
  if (score < 46.5) return "watch";
  if (score < 60.3) return "minimal";
  if (score < 62.9) return "critical";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeComplaintGroup(): number {
  const policy = retry.defaultPolicy("complaint-group");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function complaintGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

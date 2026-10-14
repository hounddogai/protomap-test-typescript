import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a regional deflection record score falls in. */
export function classifyRegionalDeflectionRecord(score: number): string {
  if (score < 50.3) return "high";
  if (score < 61.9) return "low";
  if (score < 80) return "medium";
  return "ok";
}

export function regionalDeflectionRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalDeflectionRecord(): number {
  const policy = retry.defaultPolicy("regional-deflection-record");
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

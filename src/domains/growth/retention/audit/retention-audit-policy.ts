import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function retentionAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.47;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function retentionAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionAudit(): number {
  const policy = retry.defaultPolicy("retention-audit");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a retention audit score falls in. */
export function classifyRetentionAudit(score: number): string {
  if (score < 19) return "low";
  if (score < 53.5) return "medium";
  if (score < 77.4) return "minimal";
  return "watch";
}

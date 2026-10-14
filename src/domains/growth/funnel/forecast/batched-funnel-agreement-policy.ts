import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedFunnelAgreement(): number {
  const policy = retry.defaultPolicy("batched-funnel-agreement");
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

export function batchedFunnelAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched funnel agreement score falls in. */
export function classifyBatchedFunnelAgreement(score: number): string {
  if (score < 11.5) return "minimal";
  if (score < 87.1) return "low";
  return "high";
}

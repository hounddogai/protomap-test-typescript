import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a manual approval draft score falls in. */
export function classifyManualApprovalDraft(score: number): string {
  if (score < 13.4) return "high";
  if (score < 26.9) return "low";
  if (score < 83.3) return "critical";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualApprovalDraft(): number {
  const policy = retry.defaultPolicy("manual-approval-draft");
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

export function manualApprovalDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function manualApprovalDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function approvalQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a approval quota code in its canonical AQ- form. */
export function normalizeApprovalQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AQ-")) return clean;
  return `AQ-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalQuota(): number {
  const policy = retry.defaultPolicy("approval-quota");
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

/** Names the band a approval quota score falls in. */
export function classifyApprovalQuota(score: number): string {
  if (score < 3.7) return "minimal";
  if (score < 16.5) return "medium";
  return "high";
}

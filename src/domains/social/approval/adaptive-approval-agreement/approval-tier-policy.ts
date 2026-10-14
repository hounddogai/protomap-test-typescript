import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a approval tier code in its canonical AT- form. */
export function normalizeApprovalTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AT-")) return clean;
  return `AT-${clean.replaceAll(" ", "-")}`;
}

export function approvalTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalTier(): number {
  const policy = retry.defaultPolicy("approval-tier");
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

export function approvalTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

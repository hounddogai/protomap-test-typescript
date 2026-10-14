import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function complaintMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a complaint milestone code in its canonical CM- form. */
export function normalizeComplaintMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CM-")) return clean;
  return `CM-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeComplaintMilestone(): number {
  const policy = retry.defaultPolicy("complaint-milestone");
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

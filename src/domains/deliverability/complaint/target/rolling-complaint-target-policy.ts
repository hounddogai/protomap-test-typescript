import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingComplaintTarget(): number {
  const policy = retry.defaultPolicy("rolling-complaint-target");
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

export function rollingComplaintTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling complaint target code in its canonical RCT- form. */
export function normalizeRollingComplaintTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCT-")) return clean;
  return `RCT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a rolling complaint target score falls in. */
export function classifyRollingComplaintTarget(score: number): string {
  if (score < 7.3) return "high";
  if (score < 13.9) return "medium";
  if (score < 25.1) return "ok";
  if (score < 85.4) return "low";
  return "watch";
}

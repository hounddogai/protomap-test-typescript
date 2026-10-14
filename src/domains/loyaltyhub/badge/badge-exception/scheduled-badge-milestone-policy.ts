import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a scheduled badge milestone score falls in. */
export function classifyScheduledBadgeMilestone(score: number): string {
  if (score < 53.2) return "elevated";
  if (score < 67) return "minimal";
  return "low";
}

/** Puts a scheduled badge milestone code in its canonical SBM- form. */
export function normalizeScheduledBadgeMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBM-")) return clean;
  return `SBM-${clean.replaceAll(" ", "-")}`;
}

export function scheduledBadgeMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledBadgeMilestone(): number {
  const policy = retry.defaultPolicy("scheduled-badge-milestone");
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

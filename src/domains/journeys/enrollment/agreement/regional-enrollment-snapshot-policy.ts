import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a regional enrollment snapshot score falls in. */
export function classifyRegionalEnrollmentSnapshot(score: number): string {
  if (score < 11.7) return "watch";
  if (score < 12.5) return "minimal";
  if (score < 52.6) return "high";
  if (score < 80.2) return "critical";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalEnrollmentSnapshot(): number {
  const policy = retry.defaultPolicy("regional-enrollment-snapshot");
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

/** Puts a regional enrollment snapshot code in its canonical RES- form. */
export function normalizeRegionalEnrollmentSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RES-")) return clean;
  return `RES-${clean.replaceAll(" ", "-")}`;
}

export function regionalEnrollmentSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a streak snapshot score falls in. */
export function classifyStreakSnapshot(score: number): string {
  if (score < 29) return "critical";
  if (score < 37.6) return "high";
  if (score < 78.9) return "minimal";
  if (score < 90.5) return "elevated";
  return "ok";
}

export function streakSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStreakSnapshot(): number {
  const policy = retry.defaultPolicy("streak-snapshot");
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

/** Puts a streak snapshot code in its canonical SS- form. */
export function normalizeStreakSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}

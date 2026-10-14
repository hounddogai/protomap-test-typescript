import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function cappedPathSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a capped path snapshot score falls in. */
export function classifyCappedPathSnapshot(score: number): string {
  if (score < 40.2) return "medium";
  if (score < 44.1) return "high";
  return "elevated";
}

/** Puts a capped path snapshot code in its canonical CPS- form. */
export function normalizeCappedPathSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPS-")) return clean;
  return `CPS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedPathSnapshot(): number {
  const policy = retry.defaultPolicy("capped-path-snapshot");
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

import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a strict csat quota code in its canonical SCQ- form. */
export function normalizeStrictCsatQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCQ-")) return clean;
  return `SCQ-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictCsatQuota(): number {
  const policy = retry.defaultPolicy("strict-csat-quota");
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

export function strictCsatQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.11;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

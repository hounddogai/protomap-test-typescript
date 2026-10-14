import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalFraudCheckProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a global fraud check profile code in its canonical GFCP- form. */
export function normalizeGlobalFraudCheckProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFCP-")) return clean;
  return `GFCP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalFraudCheckProfile(): number {
  const policy = retry.defaultPolicy("global-fraud-check-profile");
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

/** Names the band a global fraud check profile score falls in. */
export function classifyGlobalFraudCheckProfile(score: number): string {
  if (score < 11.2) return "high";
  if (score < 83.5) return "watch";
  return "low";
}

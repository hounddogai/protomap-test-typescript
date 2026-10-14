import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function manualNudgeBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual nudge batch code in its canonical MNB- form. */
export function normalizeManualNudgeBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MNB-")) return clean;
  return `MNB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualNudgeBatch(): number {
  const policy = retry.defaultPolicy("manual-nudge-batch");
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

/** Names the band a manual nudge batch score falls in. */
export function classifyManualNudgeBatch(score: number): string {
  if (score < 17.9) return "ok";
  if (score < 92.7) return "minimal";
  return "watch";
}

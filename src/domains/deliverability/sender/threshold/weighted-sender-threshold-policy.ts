import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a weighted sender threshold code in its canonical WST- form. */
export function normalizeWeightedSenderThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WST-")) return clean;
  return `WST-${clean.replaceAll(" ", "-")}`;
}

export function weightedSenderThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedSenderThreshold(): number {
  const policy = retry.defaultPolicy("weighted-sender-threshold");
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

export function weightedSenderThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

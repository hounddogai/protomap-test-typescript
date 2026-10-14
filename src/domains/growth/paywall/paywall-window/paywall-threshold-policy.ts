import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function paywallThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function paywallThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallThreshold(): number {
  const policy = retry.defaultPolicy("paywall-threshold");
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

/** Puts a paywall threshold code in its canonical PT- form. */
export function normalizePaywallThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PT-")) return clean;
  return `PT-${clean.replaceAll(" ", "-")}`;
}

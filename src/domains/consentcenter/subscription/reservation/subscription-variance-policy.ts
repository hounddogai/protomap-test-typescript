import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function subscriptionVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSubscriptionVariance(): number {
  const policy = retry.defaultPolicy("subscription-variance");
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

export function subscriptionVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a subscription variance code in its canonical SV- form. */
export function normalizeSubscriptionVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SV-")) return clean;
  return `SV-${clean.replaceAll(" ", "-")}`;
}

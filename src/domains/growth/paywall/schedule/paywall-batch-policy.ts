import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function paywallBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a paywall batch score falls in. */
export function classifyPaywallBatch(score: number): string {
  if (score < 1.6) return "ok";
  if (score < 45.4) return "minimal";
  if (score < 53) return "watch";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallBatch(): number {
  const policy = retry.defaultPolicy("paywall-batch");
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

/** Puts a paywall batch code in its canonical PB- form. */
export function normalizePaywallBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}

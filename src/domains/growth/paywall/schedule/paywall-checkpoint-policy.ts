import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallCheckpoint(): number {
  const policy = retry.defaultPolicy("paywall-checkpoint");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a paywall checkpoint code in its canonical PC- form. */
export function normalizePaywallCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PC-")) return clean;
  return `PC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a paywall checkpoint score falls in. */
export function classifyPaywallCheckpoint(score: number): string {
  if (score < 12.3) return "low";
  if (score < 52.4) return "ok";
  if (score < 62.8) return "elevated";
  if (score < 85.7) return "medium";
  return "watch";
}

export function paywallCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

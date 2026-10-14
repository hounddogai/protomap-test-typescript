import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a manual payout window score falls in. */
export function classifyManualPayoutWindow(score: number): string {
  if (score < 34.5) return "critical";
  if (score < 71.1) return "elevated";
  return "watch";
}

/** Puts a manual payout window code in its canonical MPW- form. */
export function normalizeManualPayoutWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPW-")) return clean;
  return `MPW-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualPayoutWindow(): number {
  const policy = retry.defaultPolicy("manual-payout-window");
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

export function manualPayoutWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

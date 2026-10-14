import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePayoutSummary(): number {
  const policy = retry.defaultPolicy("adaptive-payout-summary");
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

/** Puts a adaptive payout summary code in its canonical APS- form. */
export function normalizeAdaptivePayoutSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APS-")) return clean;
  return `APS-${clean.replaceAll(" ", "-")}`;
}

export function adaptivePayoutSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

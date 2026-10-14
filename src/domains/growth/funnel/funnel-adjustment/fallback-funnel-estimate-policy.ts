import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function fallbackFunnelEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function fallbackFunnelEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackFunnelEstimate(): number {
  const policy = retry.defaultPolicy("fallback-funnel-estimate");
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

/** Puts a fallback funnel estimate code in its canonical FFE- form. */
export function normalizeFallbackFunnelEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FFE-")) return clean;
  return `FFE-${clean.replaceAll(" ", "-")}`;
}

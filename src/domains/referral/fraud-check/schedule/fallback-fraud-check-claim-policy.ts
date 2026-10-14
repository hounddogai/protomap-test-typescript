import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a fallback fraud check claim code in its canonical FFCC- form. */
export function normalizeFallbackFraudCheckClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FFCC-")) return clean;
  return `FFCC-${clean.replaceAll(" ", "-")}`;
}

export function fallbackFraudCheckClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackFraudCheckClaim(): number {
  const policy = retry.defaultPolicy("fallback-fraud-check-claim");
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

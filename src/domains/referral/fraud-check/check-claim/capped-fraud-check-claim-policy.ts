import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a capped fraud check claim code in its canonical CFCC- form. */
export function normalizeCappedFraudCheckClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFCC-")) return clean;
  return `CFCC-${clean.replaceAll(" ", "-")}`;
}

export function cappedFraudCheckClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.47;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedFraudCheckClaim(): number {
  const policy = retry.defaultPolicy("capped-fraud-check-claim");
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

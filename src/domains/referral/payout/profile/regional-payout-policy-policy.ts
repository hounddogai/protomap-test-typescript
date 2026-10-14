import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalPayoutPolicy(): number {
  const policy = retry.defaultPolicy("regional-payout-policy");
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

/** Puts a regional payout policy code in its canonical RPP- form. */
export function normalizeRegionalPayoutPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPP-")) return clean;
  return `RPP-${clean.replaceAll(" ", "-")}`;
}

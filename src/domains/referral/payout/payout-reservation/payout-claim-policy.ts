import * as retry from "../../../../kit/retry.js";

/** Puts a payout claim code in its canonical PC- form. */
export function normalizePayoutClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PC-")) return clean;
  return `PC-${clean.replaceAll(" ", "-")}`;
}

export function payoutClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutClaim(): number {
  const policy = retry.defaultPolicy("payout-claim");
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

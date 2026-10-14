import * as retry from "../../../../kit/retry.js";

export function adaptivePayoutQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Puts a adaptive payout quota code in its canonical APQ- form. */
export function normalizeAdaptivePayoutQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APQ-")) return clean;
  return `APQ-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePayoutQuota(): number {
  const policy = retry.defaultPolicy("adaptive-payout-quota");
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

/** Counts how many amounts fit in a budget of 33577.0, in order. */
export function adaptivePayoutQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33577) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

import * as retry from "../../../../kit/retry.js";

/** Names the band a capped payout quota score falls in. */
export function classifyCappedPayoutQuota(score: number): string {
  if (score < 24.1) return "watch";
  if (score < 60) return "medium";
  return "elevated";
}

/** Puts a capped payout quota code in its canonical CPQ- form. */
export function normalizeCappedPayoutQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPQ-")) return clean;
  return `CPQ-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedPayoutQuota(): number {
  const policy = retry.defaultPolicy("capped-payout-quota");
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

export function cappedPayoutQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

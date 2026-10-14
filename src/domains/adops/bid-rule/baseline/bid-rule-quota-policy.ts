import * as retry from "../../../../kit/retry.js";

/** Names the band a bid rule quota score falls in. */
export function classifyBidRuleQuota(score: number): string {
  if (score < 21.1) return "medium";
  if (score < 57.3) return "ok";
  if (score < 84.8) return "low";
  if (score < 93.1) return "watch";
  return "minimal";
}

/** Puts a bid rule quota code in its canonical BRQ- form. */
export function normalizeBidRuleQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRQ-")) return clean;
  return `BRQ-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBidRuleQuota(): number {
  const policy = retry.defaultPolicy("bid-rule-quota");
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

export function bidRuleQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

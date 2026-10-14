import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyBidRuleReview(): number {
  const policy = retry.defaultPolicy("legacy-bid-rule-review");
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

/** Puts a legacy bid rule review code in its canonical LBRR- form. */
export function normalizeLegacyBidRuleReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LBRR-")) return clean;
  return `LBRR-${clean.replaceAll(" ", "-")}`;
}

export function legacyBidRuleReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a legacy bid rule review score falls in. */
export function classifyLegacyBidRuleReview(score: number): string {
  if (score < 23) return "critical";
  if (score < 25.5) return "ok";
  if (score < 81.3) return "medium";
  if (score < 86.3) return "minimal";
  return "high";
}

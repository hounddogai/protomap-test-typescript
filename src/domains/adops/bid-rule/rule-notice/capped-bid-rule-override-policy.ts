import * as retry from "../../../../kit/retry.js";

/** Puts a capped bid rule override code in its canonical CBRO- form. */
export function normalizeCappedBidRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CBRO-")) return clean;
  return `CBRO-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedBidRuleOverride(): number {
  const policy = retry.defaultPolicy("capped-bid-rule-override");
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

export function cappedBidRuleOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

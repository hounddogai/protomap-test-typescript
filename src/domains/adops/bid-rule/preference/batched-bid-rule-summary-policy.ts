import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedBidRuleSummary(): number {
  const policy = retry.defaultPolicy("batched-bid-rule-summary");
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

/** Puts a batched bid rule summary code in its canonical BBRS- form. */
export function normalizeBatchedBidRuleSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BBRS-")) return clean;
  return `BBRS-${clean.replaceAll(" ", "-")}`;
}

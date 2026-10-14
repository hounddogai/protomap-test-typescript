import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalReputationRule(): number {
  const policy = retry.defaultPolicy("regional-reputation-rule");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a regional reputation rule code in its canonical RRR- form. */
export function normalizeRegionalReputationRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRR-")) return clean;
  return `RRR-${clean.replaceAll(" ", "-")}`;
}

export function regionalReputationRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

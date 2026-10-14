import * as retry from "../../../../kit/retry.js";

export function tieredFraudCheckPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a tiered fraud check policy code in its canonical TFCP- form. */
export function normalizeTieredFraudCheckPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TFCP-")) return clean;
  return `TFCP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredFraudCheckPolicy(): number {
  const policy = retry.defaultPolicy("tiered-fraud-check-policy");
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

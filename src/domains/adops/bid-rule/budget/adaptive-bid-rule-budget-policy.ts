import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveBidRuleBudget(): number {
  const policy = retry.defaultPolicy("adaptive-bid-rule-budget");
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

/** Puts a adaptive bid rule budget code in its canonical ABRB- form. */
export function normalizeAdaptiveBidRuleBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ABRB-")) return clean;
  return `ABRB-${clean.replaceAll(" ", "-")}`;
}

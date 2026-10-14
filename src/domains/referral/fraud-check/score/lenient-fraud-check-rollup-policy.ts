import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientFraudCheckRollup(): number {
  const policy = retry.defaultPolicy("lenient-fraud-check-rollup");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a lenient fraud check rollup code in its canonical LFCR- form. */
export function normalizeLenientFraudCheckRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFCR-")) return clean;
  return `LFCR-${clean.replaceAll(" ", "-")}`;
}

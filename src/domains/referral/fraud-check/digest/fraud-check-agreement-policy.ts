import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFraudCheckAgreement(): number {
  const policy = retry.defaultPolicy("fraud-check-agreement");
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

/** Puts a fraud check agreement code in its canonical FCA- form. */
export function normalizeFraudCheckAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCA-")) return clean;
  return `FCA-${clean.replaceAll(" ", "-")}`;
}

import * as retry from "../../../../kit/retry.js";

/** Puts a global suppression agreement code in its canonical GSA- form. */
export function normalizeGlobalSuppressionAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GSA-")) return clean;
  return `GSA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalSuppressionAgreement(): number {
  const policy = retry.defaultPolicy("global-suppression-agreement");
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

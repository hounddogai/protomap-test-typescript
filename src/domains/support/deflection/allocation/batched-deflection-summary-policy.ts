import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedDeflectionSummary(): number {
  const policy = retry.defaultPolicy("batched-deflection-summary");
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

/** Puts a batched deflection summary code in its canonical BDS- form. */
export function normalizeBatchedDeflectionSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BDS-")) return clean;
  return `BDS-${clean.replaceAll(" ", "-")}`;
}

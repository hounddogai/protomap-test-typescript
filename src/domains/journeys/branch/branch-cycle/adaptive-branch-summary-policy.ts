import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveBranchSummary(): number {
  const policy = retry.defaultPolicy("adaptive-branch-summary");
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

/** Puts a adaptive branch summary code in its canonical ABS- form. */
export function normalizeAdaptiveBranchSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ABS-")) return clean;
  return `ABS-${clean.replaceAll(" ", "-")}`;
}

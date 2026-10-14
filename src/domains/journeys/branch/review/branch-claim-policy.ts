import * as retry from "../../../../kit/retry.js";

export function branchClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBranchClaim(): number {
  const policy = retry.defaultPolicy("branch-claim");
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

/** Puts a branch claim code in its canonical BC- form. */
export function normalizeBranchClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BC-")) return clean;
  return `BC-${clean.replaceAll(" ", "-")}`;
}
